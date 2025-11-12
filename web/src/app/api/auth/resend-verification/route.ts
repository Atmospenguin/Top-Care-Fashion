import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase";

/**
 * API route to resend email verification link
 * POST /api/auth/resend-verification
 * Body: { email: string }
 */
export async function POST(req: NextRequest) {
  try {
    console.log("🔍 Resend Verification API - Starting request");
    const body = await req.json().catch(() => ({}));
    const { email } = body as Record<string, unknown>;

    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z][A-Za-z0-9.-]*\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(normalizedEmail)) {
      console.warn("Invalid email format:", normalizedEmail);
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    console.log("📧 Resending verification email to:", normalizedEmail);

    const supabase = await createSupabaseServer();

    // Resend verification email using Supabase
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: normalizedEmail,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      }
    });

    if (error) {
      console.error("❌ Supabase resend verification failed:", error.message);

      // Return a generic success message even on error to prevent email enumeration
      // But log the actual error for debugging
      return NextResponse.json({
        ok: true,
        message: "If this email is registered, a verification link has been sent.",
      });
    }

    console.log("✅ Verification email resent successfully to:", normalizedEmail);

    return NextResponse.json({
      ok: true,
      message: "Verification email has been sent. Please check your inbox.",
    });

  } catch (error) {
    console.error("❌ Resend Verification API - Error:", error);
    return NextResponse.json(
      {
        error: "Failed to resend verification email",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
