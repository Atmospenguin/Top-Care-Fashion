"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Submitting...");

    // ding cheng input

    //switching between my backend input(true) and superbase(false) for testing
    const USE_BACKEND = true;

    // email format validation on front end

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z][A-Za-z0-9.-]*\.[A-Za-z]{2,}$/;
  if (!emailRegex.test(email)) {
    setStatus("Invalid e-mail entered, pls re-enter a valid email");
    return;
  }

    // Password validation
    if (password.length < 6) {
      setStatus("Password must be at least 6 characters long");
      return;
    }

    try {
      if (USE_BACKEND) {
        // posting registration request to dingcheng's backend
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Register failed");

        setStatus("Success! Please check your email to verify your account.");
        setTimeout(() => {
          router.push(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
        }, 1500);
      } else {

        //  use Supabase code(false)
        await signUp({ username, email, password });
        setStatus("Success! Please check your email to verify your account.");
        setTimeout(() => {
          router.push(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
        }, 1500);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      console.error("Registration error:", err);
      setStatus(`Registration failed: ${message}`);
    }
  }

  return (
    <section className="max-w-md">
      <h1 className="text-3xl font-semibold tracking-tight">Create your account</h1>
      <p className="text-sm text-black/70 mt-1">Demo signup. No real password storage.</p>
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="text-sm">
          Username
          <input
            type="text"
            className="mt-1 w-full border border-black/10 rounded-md px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]/30 focus:border-[var(--brand-color)]"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
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
            minLength={6}
            required
          />
          <span className="text-xs text-gray-500 mt-1 block">Minimum 6 characters</span>
        </label>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-md bg-[var(--brand-color)] text-white px-4 py-2 text-sm hover:opacity-90"
        >
          Sign up
        </button>
      </form>
      {status && <p className="mt-4 text-sm">{status}</p>}
    </section>
  );
}
