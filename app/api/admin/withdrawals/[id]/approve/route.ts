import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { attemptPaystackTransfer } from "@/lib/paystack-transfer";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await requireAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data: txn } = await admin
    .from("wallet_transactions")
    .select("id, amount_kobo, bank_account_id, status")
    .eq("id", id)
    .single();

  if (!txn || txn.status !== "pending_approval") {
    return NextResponse.json({ error: "This withdrawal isn't awaiting approval." }, { status: 400 });
  }

  const { data: bankAccount } = await admin
    .from("bank_accounts")
    .select("paystack_recipient_code")
    .eq("id", txn.bank_account_id)
    .single();

  if (!bankAccount) {
    return NextResponse.json({ error: "Linked bank account not found." }, { status: 404 });
  }

  // Flip to 'pending' first (a normal in-flight withdrawal) so the
  // transfer attempt and webhook resolution below behave exactly like an
  // instant withdrawal from here on.
  await admin.rpc("approve_pending_withdrawal", { p_transaction_id: id });

  const result = await attemptPaystackTransfer(id, bankAccount.paystack_recipient_code, txn.amount_kobo);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
