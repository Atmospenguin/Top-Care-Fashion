"use client";
import { useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Submitting...");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Registration failed");
      setStatus("Success! You can now go to the marketplace.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setStatus(message);
    }
  }

  return (
    <section className="max-w-md">
      <h1 className="text-3xl font-semibold tracking-tight">Create your account</h1>
      <p className="text-sm text-black/70 mt-1">Mocked registration. No real data is stored.</p>
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="text-sm">
          Email
          <input
            type="email"
            className="mt-1 w-full border border-black/10 rounded-md px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]/30 focus:border-[var(--brand-color)]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="text-sm">
          Password
          <input
            type="password"
            className="mt-1 w-full border border-black/10 rounded-md px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]/30 focus:border-[var(--brand-color)]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-md bg-[var(--brand-color)] text-white px-4 py-2 text-sm hover:opacity-90"
        >
          Register
        </button>
      </form>
      {status && <p className="mt-4 text-sm">{status}</p>}
    </section>
  );
}



