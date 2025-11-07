"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email) {
      setStatus("Please enter your email address");
      return;
    }

    if (cooldown > 0) {
      setStatus(`Please wait ${cooldown} seconds before resending`);
      return;
    }

    setIsLoading(true);
    setStatus("Sending password reset email...");

    try {
      await resetPassword(email.trim().toLowerCase());
      setStatus("Password reset email sent! Please check your inbox and spam folder.");
      setEmailSent(true);
      setCooldown(60); // 60 seconds cooldown
    } catch (error: any) {
      const message = error?.message || "Failed to send password reset email.";
      setStatus(message);
      setEmailSent(false);
    } finally {
      setIsLoading(false);
    }
  }

  function getEmailProviderUrl(email: string) {
    const domain = email.split("@")[1]?.toLowerCase();

    if (!domain) return null;

    // 根据邮箱域名返回对应的邮件服务网址
    if (domain.includes("gmail.com")) {
      return "https://mail.google.com";
    } else if (domain.includes("outlook.com") || domain.includes("hotmail.com") || domain.includes("live.com")) {
      return "https://outlook.live.com";
    } else if (domain.includes("yahoo.com")) {
      return "https://mail.yahoo.com";
    } else if (domain.includes("163.com")) {
      return "https://mail.163.com";
    } else if (domain.includes("qq.com")) {
      return "https://mail.qq.com";
    } else if (domain.includes("126.com")) {
      return "https://mail.126.com";
    } else if (domain.includes("icloud.com") || domain.includes("me.com")) {
      return "https://www.icloud.com/mail";
    }

    // 默认返回通用的 mailto 链接
    return `mailto:${email}`;
  }

  function handleOpenEmail() {
    const url = getEmailProviderUrl(email);
    if (url) {
      window.open(url, "_blank");
    }
  }

  return (
    <section className="max-w-md">
      <h1 className="text-3xl font-semibold tracking-tight">Reset Your Password</h1>

      <div className="mt-6">
        <p className="text-sm text-gray-600">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="text-sm">
          Email Address
          <input
            type="email"
            className="mt-1 w-full border border-black/10 rounded-md px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
          />
        </label>

        <button
          type="submit"
          disabled={isLoading || cooldown > 0}
          className="inline-flex items-center justify-center rounded-md bg-[var(--brand-color)] text-white px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading
            ? "Sending..."
            : cooldown > 0
            ? `Resend in ${cooldown}s`
            : "Send Reset Link"}
        </button>
      </form>

      {status && (
        <div className="mt-4">
          <p className={`text-sm ${status.includes("sent") || status.includes("Sent") ? "text-green-600" : "text-gray-700"}`}>
            {status}
          </p>

          {emailSent && (
            <button
              onClick={handleOpenEmail}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Open Email App
            </button>
          )}
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex flex-col gap-2 text-sm">
          <p className="text-gray-600">Remember your password?</p>
          <button
            onClick={() => router.push("/signin")}
            className="text-[var(--brand-color)] hover:underline text-left"
          >
            Back to Sign In
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="text-sm font-medium text-blue-900">Tips:</h3>
        <ul className="mt-2 text-sm text-blue-800 list-disc list-inside space-y-1">
          <li>Check your spam or junk folder</li>
          <li>The reset link is valid for 1 hour</li>
          <li>Make sure you entered the correct email address</li>
          <li>If you don&apos;t receive the email, you can request a new one after 60 seconds</li>
        </ul>
      </div>
    </section>
  );
}
