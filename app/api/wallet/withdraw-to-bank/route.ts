import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { nairaToKobo } from "@/lib/format";
import { attemptPaystackTransfer } from "@/lib/paystack-transfer";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const bankAccountId = body?.bankAccountId;
  const amountNaira = Number(body?.amount);

  if (!bankAccountId || !amountNaira || amountNaira <= 0) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data: bankAccount } = await supabase
    .from("bank_accounts")
    .select("paystack_recipient_code")
    .eq("id", bankAccountId)
    .eq("user_id", user.id)
    .single();

  if (!bankAccount) {
    return NextResponse.json({ error: "Bank account not found" }, { status: 404 });
  }

  const amountKobo = nairaToKobo(amountNaira);

  // Step 1: reserve — deducts the wallet balance and creates a ledger row
  // BEFORE any Paystack call. reserve_withdrawal() itself decides whether
  // this amount is above the approval threshold, returning either a
  // 'pending' row (proceed below) or 'pending_approval' (an admin needs
  // to sign off before any transfer is attempted at all). If anything
  // below fails, the reservation gets refunded — the balance never
  // reflects money that's both gone from the wallet and never sent.
  const { data: transactionId, error: reserveError } = await supabase.rpc(
    "reserve_withdrawal",
    { p_bank_account_id: bankAccountId, p_amount_kobo: amountKobo }
  );

  if (reserveError) {
    return NextResponse.json({ error: reserveError.message }, { status: 400 });
  }

  const { data: transaction } = await supabase
    .from("wallet_transactions")
    .select("status")
    .eq("id", transactionId)
    .single();

  if (transaction?.status === "pending_approval") {
    // Deliberately no Paystack call here at all — large withdrawals wait
    // for a human to approve them first (see /admin/withdrawals).
    return NextResponse.json({ success: true, status: "pending_approval" });
  }

  const result = await attemptPaystackTransfer(
    transactionId,
    bankAccount.paystack_recipient_code,
    amountKobo
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ success: true, status: "pending" });
}
