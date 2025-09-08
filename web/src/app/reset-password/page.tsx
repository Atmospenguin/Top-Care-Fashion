"use client";
import { useState } from "react";
import { useAuth } from "@/components/AuthContext";

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Sending...");
    await resetPassword(email);
    setStatus("Password reset email sent (demo)");
  }

  return (
    <section className="max-w-md">
      <h1 className="text-3xl font-semibold tracking-tight">Reset password</h1>
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="text-sm">Email
          <input type="email" className="mt-1 w-full border border-black/10 rounded-md px-3 py-2" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        </label>
        <button type="submit" className="inline-flex items-center rounded-md bg-[var(--brand-color)] text-white px-4 py-2 text-sm hover:opacity-90">Send</button>
      </form>
      {status && <p className="mt-4 text-sm">{status}</p>}
    </section>
  );
}
