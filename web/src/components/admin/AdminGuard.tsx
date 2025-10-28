"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";

type MeResponse = {
  user: null | {
    id: number;
    username: string;
    email: string;
    role: "User" | "Admin";
    status: "active" | "suspended";
  };
};

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { setActor } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const json: MeResponse = await res.json();
      const nextIsAdmin = json.user?.role === "Admin";
      setIsAdmin(nextIsAdmin);
      setActor(nextIsAdmin ? "Admin" : "User");
    } catch (e: any) {
      setError(e?.message || "Unable to Check Admin Status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Login Failed (${res.status})`);
      }
      // 登录成功，重新检查权限
      await load();
    } catch (e: any) {
      setError(e?.message || "Login Failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full py-10 text-center text-gray-600">Checking Admin Status...</div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-6 border rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Admin Login</h2>
        <p className="text-sm text-gray-600 mb-4">
          You do not have admin access. Please enter the admin password to continue.
        </p>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            placeholder="Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-black text-white rounded disabled:opacity-60"
          >
            {submitting ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
