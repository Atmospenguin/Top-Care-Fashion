"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Gender = "Male" | "Female";
export type Actor = "User" | "Admin";

export type User = {
  username: string;
  email: string;
  dob?: string; // ISO date string
  gender?: Gender;
  actor: Actor;
  isPremium?: boolean;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  signUp: (data: { username: string; email: string; password: string; dob?: string; gender?: Gender }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  setActor: (actor: Actor) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "topcare_user";

function normalizeDob(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeGender(value: unknown): Gender | undefined {
  return value === "Male" || value === "Female" ? value : undefined;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  // Hydrate from server session
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/auth/me", { cache: "no-store" });
        const j = await r.json();
        if (j.user) {
          setUser({
            username: j.user.username,
            email: j.user.email,
            dob: normalizeDob(j.user.dob),
            gender: normalizeGender(j.user.gender),
            actor: j.user.role === "Admin" ? "Admin" : "User",
            isPremium: !!j.user.isPremium,
          });
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    try {
      if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, [user]);

  const signUp: AuthContextType["signUp"] = async ({ username, email, password, dob, gender }) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, dob, gender }),
    });
    if (!res.ok) throw new Error("Register failed");
    const j = await res.json();
    setUser({
      username: j.user.username,
      email: j.user.email,
      dob: normalizeDob(j.user.dob ?? dob),
      gender: normalizeGender(j.user.gender ?? gender),
      actor: j.user.role === "Admin" ? "Admin" : "User",
      isPremium: !!j.user.isPremium,
    });
  };

  const signIn: AuthContextType["signIn"] = async (email, password) => {
    const res = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    let j: any = null;
    try {
      j = await res.json();
    } catch {}
    if (!res.ok) {
      const msg = (j && (j.error || j.message)) || "Invalid credentials";
      throw new Error(msg);
    }
    setUser({
      username: j.user.username,
      email: j.user.email,
      dob: normalizeDob(j.user.dob),
      gender: normalizeGender(j.user.gender),
      actor: j.user.role === "Admin" ? "Admin" : "User",
      isPremium: !!j.user.isPremium,
    });
  };

  const signOut = () => {
    fetch("/api/auth/signout", { method: "POST" });
    setUser(null);
  };

  const resetPassword: AuthContextType["resetPassword"] = async (_email) => {
    await new Promise((r) => setTimeout(r, 250));
    // placeholder implementation
  };

  const updateProfile: AuthContextType["updateProfile"] = async (data) => {
    const payload: Record<string, unknown> = {};
    if (data.username !== undefined) payload.username = data.username;
    if (data.email !== undefined) payload.email = data.email;
    if (data.dob !== undefined) payload.dob = data.dob;
    if (data.gender !== undefined) payload.gender = data.gender;

    if (Object.keys(payload).length === 0) {
      setUser((u) => (u ? { ...u, ...data } : u));
      return;
    }

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    let j: any = null;
    try {
      j = await res.json();
    } catch {}

    if (!res.ok) {
      const msg = (j && (j.error || j.message)) || "Profile update failed";
      throw new Error(msg);
    }

    setUser({
      username: j.user.username,
      email: j.user.email,
      dob: normalizeDob(j.user.dob),
      gender: normalizeGender(j.user.gender),
      actor: j.user.role === "Admin" ? "Admin" : "User",
      isPremium: !!j.user.isPremium,
    });
  };

  const setActor = (_actor: Actor) => {};

  const value = useMemo<AuthContextType>(
    () => ({ user, isAuthenticated: !!user, signUp, signIn, signOut, resetPassword, updateProfile, setActor }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

