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
  const [confirmPassword, setConfirmPassword] = useState("");
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

    // Confirm password validation
    if (password !== confirmPassword) {
      setStatus("Passwords do not match");
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
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
      <section className="max-w-md w-full">
        <h1 className="text-3xl font-semibold mb-8">Welcome to TOP!</h1>

        {status && (
        <div className="mb-4 p-3 rounded-md text-sm bg-blue-50 text-blue-800 border border-blue-200">
          {status}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          className="w-full border border-gray-300 rounded-md px-4 py-3 bg-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          required
        />
        <input
          type="email"
          className="w-full border border-gray-300 rounded-md px-4 py-3 bg-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          className="w-full border border-gray-300 rounded-md px-4 py-3 bg-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          minLength={6}
          required
        />
        <input
          type="password"
          className="w-full border border-gray-300 rounded-md px-4 py-3 bg-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm password"
          minLength={6}
          required
        />
        <button
          type="submit"
          className="w-full rounded-md bg-gray-800 text-white px-4 py-3 text-base font-medium hover:bg-gray-700 transition-colors"
        >
          Register
        </button>
      </form>
      </section>
    </div>
  );
}
