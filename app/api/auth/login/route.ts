import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Login now goes through this route instead of the browser calling
 * supabase.auth.signInWithPassword() directly — that's what makes
 * per-account rate limiting possible. Failed attempts are tracked by
 * email (not IP), so this can't be bypassed by switching networks.
 *
 * Uses the SERVER Supabase client so a successful sign-in's session
 * cookie is set correctly on the response, same as any other server-side
 * auth action in this app.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: allowed } = await admin.rpc("check_login_allowed", { p_email: email });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many failed attempts. Try again in 15 minutes." },
      { status: 429 }
    );
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

  await admin.from("login_attempts").insert({ email, success: !signInError });

  if (signInError) {
    return NextResponse.json(
      {
        error:
          signInError.message === "Email not confirmed"
            ? "Verify your email first."
            : "That email and password don't match.",
      },
      { status: 401 }
    );
  }

  // Check MFA assurance level here too — the session cookie is now set on
  // this same server client, so this reflects the just-created session.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const needsMfa = !!(aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2");

  return NextResponse.json({ success: true, needsMfa });
}
