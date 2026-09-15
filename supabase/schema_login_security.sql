-- Nestegg: Terms consent tracking + login rate limiting
-- Run this AFTER all previous schema files.

-- 1. Terms/privacy consent -----------------------------------------------------
-- Tracks WHICH version of the terms someone agreed to and WHEN — useful
-- if terms change later and you need to know who agreed to what.
alter table public.profiles
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version text;

-- Redefines handle_new_user one more time, folding in everything from
-- prior versions (wallet creation from schema_savings_wallet.sql,
-- referral_code/referred_by from schema_referral.sql) plus consent
-- capture — this is the final, complete version as of this file.
-- Consent is set here (security-definer, at account creation) rather
-- than via a client-side profile update, since terms_accepted_at isn't
-- one of the columns the authenticated role can write directly
-- (see migration_restrict_profile_column_updates.sql).
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_referrer_id uuid;
  v_ref_code_used text;
  v_terms_accepted boolean;
begin
  v_ref_code_used := upper(nullif(trim(new.raw_user_meta_data ->> 'referral_code_used'), ''));
  v_terms_accepted := coalesce((new.raw_user_meta_data ->> 'terms_accepted')::boolean, false);

  if v_ref_code_used is not null then
    select id into v_referrer_id from public.profiles where referral_code = v_ref_code_used;
  end if;

  insert into public.profiles (
    id, full_name, phone, referral_code, referred_by,
    terms_accepted_at, terms_version
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.phone,
    public.generate_referral_code(new.id),
    v_referrer_id,
    case when v_terms_accepted then now() else null end,
    case when v_terms_accepted then 'v1' else null end
  )
  on conflict (id) do nothing;

  insert into public.wallets (user_id, balance_kobo)
  values (new.id, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- 2. Login attempt tracking + rate limiting -------------------------------------
-- Tracked by email rather than user_id, since a failed login (wrong
-- password) happens before we know for certain which account was being
-- targeted — email is what the attempt itself was made against.
create table if not exists public.login_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  success boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists login_attempts_email_idx on public.login_attempts (email, created_at desc);

create or replace function public.check_login_allowed(p_email text)
returns boolean as $$
declare
  v_recent_failures int;
begin
  select count(*) into v_recent_failures
    from public.login_attempts
    where email = lower(p_email)
      and success = false
      and created_at > now() - interval '15 minutes';

  return v_recent_failures < 5;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.check_login_allowed(text) to service_role;

-- 3. RLS + grants ----------------------------------------------------------
alter table public.login_attempts enable row level security;
-- No policies — this table is only ever touched by the service-role
-- login route, never directly by a client. Same pattern as otp_codes.

grant select, insert on table public.login_attempts to service_role;
