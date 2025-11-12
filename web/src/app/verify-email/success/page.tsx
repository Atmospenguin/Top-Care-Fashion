"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function VerifyEmailSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [secondsRemaining, setSecondsRemaining] = useState(5);

  const redirectUrl = useMemo(() => {
    const next = searchParams.get("redirect");
    if (next) {
      const encodedNext = encodeURIComponent(next);
      return `/signin?next=${encodedNext}`;
    }
    return "/signin";
  }, [searchParams]);

  const message =
    searchParams.get("message") ||
    "Your email has been verified successfully. You can now sign in to your account.";

  useEffect(() => {
    const tick = window.setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const timeout = window.setTimeout(() => {
      router.push(redirectUrl);
    }, 5000);

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(timeout);
    };
  }, [redirectUrl, router]);

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-gray-50">
      <section className="max-w-lg w-full mx-4 rounded-2xl border border-orange-200 bg-white/90 shadow-lg backdrop-blur">
        <div className="px-8 py-10 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-3xl">
              ✓
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-semibold text-gray-900">Email Verified</h1>
            <p className="text-base text-gray-600 leading-relaxed">{message}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              Redirecting you to the login page in{" "}
              <span className="font-semibold text-gray-700">{secondsRemaining}</span> seconds.
            </p>
            <p className="text-sm text-gray-500">The page will take you there automatically.</p>
          </div>

          <div>
            <button
              onClick={() => router.push(redirectUrl)}
              className="inline-flex items-center gap-2 rounded-md bg-[var(--brand-color)] text-white px-5 py-2.5 text-sm font-medium shadow hover:shadow-md transition"
            >
              Go to Login
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

