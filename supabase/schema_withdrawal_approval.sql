-- Nestegg: Withdrawal approval threshold
-- Run this AFTER all previous schema files.
--
-- Until now, every bank withdrawal was fully automatic regardless of
-- amount. This adds a configurable threshold above which a withdrawal
-- goes to 'pending_approval' instead of straight to Paystack — a real
-- safety net against fraud or mistakes, matching the "Withdrawals
-- Approval" admin feature in the original flowchart. Smaller amounts
-- still process instantly.

-- 1. New status value -----------------------------------------------------
alter table public.wallet_transactions
  drop constraint if exists wallet_transactions_status_check;
alter table public.wallet_transactions
  add constraint wallet_transactions_status_check
  check (status in ('pending', 'success', 'failed', 'pending_approval'));

-- 2. Configurable threshold, reusing the app_settings table from
--    schema_settings.sql -----------------------------------------------------
insert into public.app_settings (key, value) values
  ('withdrawal_approval_threshold_kobo', '10000000') -- NGN 100,000 default
on conflict (key) do nothing;

create or replace function public.get_withdrawal_approval_threshold_kobo()
returns bigint as $$
declare
  v_value text;
begin
  select value into v_value from public.app_settings where key = 'withdrawal_approval_threshold_kobo';
  return coalesce(v_value::bigint, 10000000);
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.get_withdrawal_approval_threshold_kobo() to authenticated, service_role;

-- 3. Update reserve_withdrawal to route large withdrawals to review --------
create or replace function public.reserve_withdrawal(
  p_bank_account_id uuid,
  p_amount_kobo bigint
) returns uuid as $$
declare
  v_user_id uuid := auth.uid();
  v_balance bigint;
  v_kyc_status text;
  v_bank_owner uuid;
  v_transaction_id uuid;
  v_threshold bigint;
  v_status text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  if p_amount_kobo <= 0 then
    raise exception 'Amount must be positive';
  end if;

  select kyc_status into v_kyc_status from public.profiles where id = v_user_id;
  if v_kyc_status is distinct from 'verified' then
    raise exception 'KYC verification is required before withdrawing to a bank account';
  end if;

  select user_id into v_bank_owner from public.bank_accounts where id = p_bank_account_id;
  if v_bank_owner is null or v_bank_owner <> v_user_id then
    raise exception 'Bank account not found';
  end if;

  select balance_kobo into v_balance from public.wallets where user_id = v_user_id for update;
  if v_balance is null or v_balance < p_amount_kobo then
    raise exception 'Insufficient wallet balance';
  end if;

  select public.get_withdrawal_approval_threshold_kobo() into v_threshold;
  v_status := case when p_amount_kobo >= v_threshold then 'pending_approval' else 'pending' end;

  update public.wallets set balance_kobo = balance_kobo - p_amount_kobo where user_id = v_user_id;

  insert into public.wallet_transactions (user_id, type, amount_kobo, status, bank_account_id, description)
  values (
    v_user_id, 'withdrawal', p_amount_kobo, v_status, p_bank_account_id,
    case when v_status = 'pending_approval'
      then 'Withdrawal to bank account — awaiting review'
      else 'Withdrawal to bank account'
    end
  )
  returning id into v_transaction_id;

  if v_status = 'pending_approval' then
    insert into public.notifications (user_id, type, title, body, link)
    values (
      v_user_id, 'withdrawal_successful', 'Withdrawal under review',
      'This withdrawal is above the instant-transfer limit and needs a quick review — you''ll be notified once it''s processed.',
      '/dashboard/wallet'
    );
  end if;

  return v_transaction_id;
end;
$$ language plpgsql security definer set search_path = public;

-- 4. Admin approve/reject functions --------------------------------------------
create or replace function public.approve_pending_withdrawal(p_transaction_id uuid)
returns void as $$
begin
  update public.wallet_transactions
    set status = 'pending', description = 'Withdrawal to bank account'
    where id = p_transaction_id and status = 'pending_approval';
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.approve_pending_withdrawal(uuid) to service_role;

-- Rejection reuses resolve_withdrawal's refund logic, but that function
-- only acts on status = 'pending' — widen it to also accept
-- 'pending_approval' so both paths funnel through one refund path.
create or replace function public.resolve_withdrawal(
  p_transaction_id uuid,
  p_success boolean,
  p_paystack_reference text default null
) returns void as $$
declare
  v_txn public.wallet_transactions%rowtype;
begin
  select * into v_txn from public.wallet_transactions
    where id = p_transaction_id and type = 'withdrawal' for update;

  if v_txn.id is null or v_txn.status not in ('pending', 'pending_approval') then
    return; -- already resolved, or not a withdrawal — no-op
  end if;

  if p_success then
    update public.wallet_transactions
      set status = 'success', paystack_reference = coalesce(p_paystack_reference, paystack_reference)
      where id = p_transaction_id;
  else
    update public.wallets set balance_kobo = balance_kobo + v_txn.amount_kobo
      where user_id = v_txn.user_id;
    update public.wallet_transactions set status = 'failed' where id = p_transaction_id;
  end if;
end;
$$ language plpgsql security definer set search_path = public;

-- 5. Grants -----------------------------------------------------------------
grant update on table public.app_settings to service_role; -- already granted select in schema_settings.sql
