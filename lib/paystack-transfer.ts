import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Attempts a Paystack transfer for an already-reserved withdrawal
 * transaction. Shared between the instant-withdrawal path
 * (app/api/wallet/withdraw-to-bank) and the admin-approval path
 * (app/api/admin/withdrawals/[id]/approve) — both need identical
 * behavior once a transfer is actually being attempted.
 *
 * On any failure, refunds the reservation via resolve_withdrawal() rather
 * than leaving it stuck pending forever.
 */
export async function attemptPaystackTransfer(
  transactionId: string,
  recipientCode: string,
  amountKobo: number
): Promise<{ success: true } | { success: false; error: string }> {
  const admin = createAdminClient();

  try {
    const transferRes = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "balance",
        amount: amountKobo,
        recipient: recipientCode,
        reason: "Nestegg withdrawal",
        reference: transactionId,
      }),
    });
    const transferData = await transferRes.json();
    const transferStatus = transferData?.data?.status;

    // "otp" means the Paystack account has OTP-for-transfers enabled,
    // which requires manual finalization on the BUSINESS's registered
    // phone — not something this flow can complete. Treat it as a
    // failure and tell the operator to disable it (Paystack dashboard ->
    // Settings -> Preferences -> Transfers).
    if (!transferRes.ok || !transferData?.status || transferStatus === "otp") {
      await admin.rpc("resolve_withdrawal", { p_transaction_id: transactionId, p_success: false });
      const message =
        transferStatus === "otp"
          ? "Transfers require OTP finalization on this Paystack account — disable that in Paystack settings."
          : transferData?.message ?? "Transfer could not be started.";
      return { success: false, error: message };
    }

    // Transfer accepted — Paystack processes it async. The webhook
    // (transfer.success / transfer.failed / transfer.reversed) is what
    // actually resolves this transaction to success or failed. We just
    // record Paystack's transfer_code for reference now.
    await admin
      .from("wallet_transactions")
      .update({ paystack_reference: transferData.data.transfer_code })
      .eq("id", transactionId);

    return { success: true };
  } catch (err) {
    await admin.rpc("resolve_withdrawal", { p_transaction_id: transactionId, p_success: false });
    console.error("Paystack transfer call failed:", err);
    return { success: false, error: "Could not reach the payment processor. Funds have been returned." };
  }
}
