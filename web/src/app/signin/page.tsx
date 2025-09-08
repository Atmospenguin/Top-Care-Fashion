"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthContext";

export default function SignInPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Signing in...");
    await signIn(email, password);
    setStatus("Success");
    router.push("/");
  }

  return (
    <section className="max-w-md">
      <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
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
      {status && <p className="mt-4 text-sm">{status}</p>}
    </section>
  );
}
