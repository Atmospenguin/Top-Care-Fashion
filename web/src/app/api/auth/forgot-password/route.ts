import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase";

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z][A-Za-z0-9.-]*\.[A-Za-z]{2,}$/;

function resolveSiteUrl(req: NextRequest) {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SUPABASE_RESET_REDIRECT_URL ||
    process.env.APP_ORIGIN ||
    "";
  if (envUrl.trim()) return envUrl.trim().replace(/\/+$/, "");
  return req.nextUrl.origin.replace(/\/+$/, "");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "E-mail format is invalid. Please enter a valid e-mail." },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServer();
    const redirectBase = resolveSiteUrl(req);
    const redirectUrl = `${redirectBase}/reset-password/confirm`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      // Avoid leaking which e-mails exist; log for observability and still reply success.
      console.warn("Password reset email error:", error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Failed to request password reset" }, { status: 500 });
  }
}
