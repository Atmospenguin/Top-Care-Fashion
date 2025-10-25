"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthContext";
import type { Gender } from "@/components/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Submitting...");
    try {
      await signUp({ username, email, password, dob, gender: gender || undefined });
      setStatus("Success! Redirecting...");
      router.push("/");
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
            required
          />
        </label>
        <label className="text-sm">
          Date of Birth
          <input
            type="date"
            className="mt-1 w-full border border-black/10 rounded-md px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]/30 focus:border-[var(--brand-color)]"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Gender
          <select
            className="mt-1 w-full border border-black/10 rounded-md px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]/30 focus:border-[var(--brand-color)]"
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender | "")}
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
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
