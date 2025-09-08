"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Gender = "Male" | "Female" | "Other" | "Prefer not to say";
export type Actor = "Buyer" | "Seller" | "Admin";

export type User = {
  username: string;
  email: string;
  dob?: string; // ISO date string
  gender?: Gender;
  actor: Actor;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, [user]);

  const signUp: AuthContextType["signUp"] = async ({ username, email, password, dob, gender }) => {
    // Mocked signup; password is ignored in storage for prototype
    await new Promise((r) => setTimeout(r, 300));
    setUser({ username, email, dob, gender, actor: "Buyer" });
  };

  const signIn: AuthContextType["signIn"] = async (email, _password) => {
    await new Promise((r) => setTimeout(r, 250));
    // If an account exists in storage, use it; otherwise create a lightweight session
    setUser((prev) => prev ?? { username: email.split("@")[0] || "User", email, actor: "Buyer" });
  };

  const signOut = () => setUser(null);

  const resetPassword: AuthContextType["resetPassword"] = async (_email) => {
    await new Promise((r) => setTimeout(r, 250));
    // no-op mocked
  };

  const updateProfile: AuthContextType["updateProfile"] = async (data) => {
    await new Promise((r) => setTimeout(r, 150));
    setUser((u) => (u ? { ...u, ...data } : u));
  };

  const setActor = (actor: Actor) => setUser((u) => (u ? { ...u, actor } : u));

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
