"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/components/AuthContext";

function SignInContent() {
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  // Check for success or error messages from URL params
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success) {
      setStatus(success);
    } else if (error) {
      setStatus(error);
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Signing in...");


    try {

      // Ensure email has no duplicate cases from db
      const normalizedEmail = email.trim().toLowerCase();

      await signIn(normalizedEmail, password);
      setStatus("Success");
      router.push("/");
    } catch (err: any) {
      const errorMessage = err?.message || "Sign in failed";

      // Check if email is not verified
      if (errorMessage.includes("Unverified Email") || errorMessage.includes("verify your email")) {
        // Redirect to verify email page with email as query param
        router.push(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
        return;
      }

      setStatus(errorMessage);
    }
  }

  return (
    <section className="max-w-md">
      <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>

      {status && (
        <div
          className={`mt-4 p-3 rounded-md text-sm ${
            status.includes("successfully") || status.includes("Success")
              ? "bg-green-50 text-green-800 border border-green-200"
              : status.includes("failed") || status.includes("error") || status.includes("Error")
              ? "bg-red-50 text-red-800 border border-red-200"
              : "bg-blue-50 text-blue-800 border border-blue-200"
          }`}
        >
          {status}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="text-sm">Email
          <input type="email" className="mt-1 w-full border border-black/10 rounded-md px-3 py-2" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        </label>
        <label className="text-sm">Password
          <input type="password" className="mt-1 w-full border border-black/10 rounded-md px-3 py-2" value={password} onChange={(e)=>setPassword(e.target.value)} required />
        </label>
        <div className="flex items-center justify-between">
          <button type="submit" className="inline-flex items-center rounded-md bg-[var(--brand-color)] text-white px-4 py-2 text-sm hover:opacity-90">Sign in</button>
          <a href="/reset-password" className="text-sm text-[var(--brand-color)] hover:underline">Forgot password?</a>
        </div>
      </form>
    </section>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <section className="max-w-md">
        <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
      </section>
    }>
      <SignInContent />
    </Suspense>
  );
}
