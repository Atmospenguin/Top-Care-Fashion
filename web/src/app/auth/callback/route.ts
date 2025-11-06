import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase";

/**
 * Auth callback handler for email verification
 * This route is called when a user clicks the verification link in their email
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    const next = searchParams.get("next") ?? "/";

    console.log("🔍 Auth Callback - Type:", type);
    console.log("🔍 Auth Callback - Token hash present:", !!token_hash);

    if (token_hash && type) {
      const supabase = await createSupabaseServer();

      // Verify the token hash
      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as any,
      });

      if (error) {
        console.error("❌ Auth Callback - Verification failed:", error.message);
        return NextResponse.redirect(
          new URL(
            `/signin?error=${encodeURIComponent("Email verification failed. Please try again.")}`,
            req.url
          )
        );
      }

      console.log("✅ Auth Callback - Email verified successfully");

      // Email verified successfully, redirect to success page or login
      return NextResponse.redirect(
        new URL(
          `/signin?success=${encodeURIComponent("Email verified successfully! You can now sign in.")}`,
          req.url
        )
      );
    }

    // No token hash or type provided
    console.warn("⚠️ Auth Callback - Missing token_hash or type");
    return NextResponse.redirect(new URL("/signin?error=Invalid+verification+link", req.url));

  } catch (error) {
    console.error("❌ Auth Callback - Error:", error);
    return NextResponse.redirect(
      new URL(
        `/signin?error=${encodeURIComponent("An error occurred during verification")}`,
        req.url
      )
    );
  }
}
