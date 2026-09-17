import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatKobo } from "@/lib/format";
import WithdrawalActions from "./withdrawal-actions";

export default async function AdminWithdrawalsPage() {
  const user = await requireAdminUser();
  if (!user) redirect("/dashboard");

  const admin = createAdminClient();
  const { data: withdrawals } = await admin
    .from("wallet_transactions")
    .select("id, amount_kobo, created_at, user_id, bank_account_id")
    .eq("status", "pending_approval")
    .order("created_at", { ascending: true });

  // Fetched separately and merged manually rather than using PostgREST's
  // embed syntax — that pattern repeatedly hit a "more than one
  // relationship" ambiguity error elsewhere in this app that survived a
  // schema cache reload and a full project restart. Doing the joins in
  // code sidesteps it entirely.
  const userIds = [...new Set((withdrawals ?? []).map((w) => w.user_id))];
  const bankAccountIds = [...new Set((withdrawals ?? []).map((w) => w.bank_account_id).filter(Boolean))];

  const [{ data: requesters }, { data: bankAccounts }] = await Promise.all([
    userIds.length
      ? admin.from("profiles").select("id, full_name").in("id", userIds)
      : Promise.resolve({ data: [] }),
    bankAccountIds.length
      ? admin.from("bank_accounts").select("id, bank_name, account_number, account_name").in("id", bankAccountIds)
      : Promise.resolve({ data: [] }),
  ]);

  const requesterMap = new Map((requesters ?? []).map((r) => [r.id, r.full_name]));
  const bankMap = new Map((bankAccounts ?? []).map((b) => [b.id, b]));

  return (
    <div>
      <h2 className="font-display font-extrabold text-base text-navy mb-1">
        Withdrawal approvals
      </h2>
      <p className="text-sm text-ink-soft mb-5">
        Withdrawals above the instant-transfer threshold wait here for
        review before any money moves.
      </p>

      <div className="flex flex-col gap-3">
        {withdrawals?.map((w) => {
          const bank = w.bank_account_id ? bankMap.get(w.bank_account_id) : null;
          return (
            <div key={w.id} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-ink">
                    {requesterMap.get(w.user_id) ?? "Unknown"}
                  </p>
                  <p className="text-[11px] text-ink-soft mt-0.5">
                    {new Date(w.created_at).toLocaleString("en-NG", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <p className="font-display font-extrabold text-lg text-navy">
                  {formatKobo(w.amount_kobo)}
                </p>
              </div>
              <p className="text-[12.5px] text-ink-soft mt-2">
                To: {bank?.bank_name} · {bank?.account_name} · •••• {bank?.account_number?.slice(-4)}
              </p>
              <WithdrawalActions transactionId={w.id} />
            </div>
          );
        })}
        {!withdrawals?.length && (
          <p className="text-sm text-ink-soft text-center py-8">
            No withdrawals awaiting review.
          </p>
        )}
      </div>
    </div>
  );
}
