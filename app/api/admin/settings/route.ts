import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { nairaToKobo } from "@/lib/format";

export async function POST(request: NextRequest) {
  const adminUser = await requireAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const amountNaira = Number(body?.thresholdNaira);

  if (!amountNaira || amountNaira <= 0) {
    return NextResponse.json({ error: "Enter a threshold greater than ₦0." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("app_settings")
    .update({ value: String(nairaToKobo(amountNaira)) })
    .eq("key", "withdrawal_approval_threshold_kobo");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
