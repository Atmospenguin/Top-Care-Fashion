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
    } catch (err: any) {
      setStatus(err.message || "Something went wrong");
    }
  }

  return (
    <section className="max-w-md">
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <p className="text-sm text-black/70 dark:text-white/70 mt-1">
        Mocked registration. No real data is stored.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
        <label className="text-sm">
          Email
          <input
            type="email"
            className="mt-1 w-full border border-black/10 dark:border-white/20 rounded-md px-3 py-2 bg-transparent"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="text-sm">
          Password
          <input
            type="password"
            className="mt-1 w-full border border-black/10 dark:border-white/20 rounded-md px-3 py-2 bg-transparent"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-md bg-black text-white px-4 py-2 text-sm hover:bg-black/85"
        >
          Register
        </button>
      </form>
      {status && <p className="mt-4 text-sm">{status}</p>}
    </section>
  );
}



