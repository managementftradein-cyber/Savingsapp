import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatKobo } from "@/lib/format";
import ThresholdForm from "./threshold-form";

export default async function AdminSettingsPage() {
  const user = await requireAdminUser();
  if (!user) redirect("/dashboard");

  const admin = createAdminClient();
  const { data } = await admin
    .from("app_settings")
    .select("value")
    .eq("key", "withdrawal_approval_threshold_kobo")
    .single();

  const currentThresholdKobo = Number(data?.value ?? 10000000);

  return (
    <div>
      <h2 className="font-display font-extrabold text-base text-navy mb-1">Settings</h2>
      <p className="text-sm text-ink-soft mb-5">
        Currently: withdrawals of {formatKobo(currentThresholdKobo)} or more
        require admin approval before any transfer is attempted.
      </p>

      <ThresholdForm currentThresholdNaira={currentThresholdKobo / 100} />
    </div>
  );
}
