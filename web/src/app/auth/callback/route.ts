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
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/";

    console.log("🔍 Auth Callback - Type:", type);
    console.log("🔍 Auth Callback - Token hash present:", !!token_hash);
    console.log("🔍 Auth Callback - Code present:", !!code);

    const supabase = await createSupabaseServer();

    // Handle code-based verification (newer Supabase flow)
    if (code) {
      console.log("📧 Auth Callback - Processing code-based verification");
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("❌ Auth Callback - Code exchange failed:", error.message);
        return NextResponse.redirect(
          new URL(
            `/signin?error=${encodeURIComponent("Email verification failed. Please try again.")}`,
            req.url
          )
        );
      }

      if (data.session) {
        console.log("✅ Auth Callback - Email verified successfully via code");
        
        // Email verified successfully, redirect to verification success page
        const successUrl = new URL("/verify-email/success", req.url);
        successUrl.searchParams.set(
          "message",
          "Email verified successfully! You can now sign in."
        );
        if (next && next !== "/") {
          successUrl.searchParams.set("redirect", next);
        }

        return NextResponse.redirect(successUrl);
      }
    }

    // Handle token_hash-based verification (older Supabase flow)
    if (token_hash && type) {
      console.log("📧 Auth Callback - Processing token_hash-based verification");
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

      console.log("✅ Auth Callback - Email verified successfully via token_hash");

      // Email verified successfully, redirect to verification success page
      const successUrl = new URL("/verify-email/success", req.url);
      successUrl.searchParams.set(
        "message",
        "Email verified successfully! You can now sign in."
      );
      if (next && next !== "/") {
        successUrl.searchParams.set("redirect", next);
      }

      return NextResponse.redirect(successUrl);
    }

    // No valid verification parameters provided
    console.warn("⚠️ Auth Callback - Missing token_hash/type or code");
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
