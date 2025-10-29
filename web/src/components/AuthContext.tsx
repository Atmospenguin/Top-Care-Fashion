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
  //ding cheng input
  // add in new boolean isLoading to handle loading of page for session
  isLoading: boolean;
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
  //ding cheng input
  //this to prevent the user interface from entering between login and logout
const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch (err) {
      console.error("AuthContext: localStorage failed to read", err);
    }
  }, []);

  // Hydrate from server session
  useEffect(() => {
    //temporary test 
    ////
    console.log("AuthContext: Starting session hydration...");
    (async () => {
      try {
        const r = await fetch("/api/auth/me", { cache: "no-store" });
        const j = await r.json();
        ////
        console.log("/api/auth/me response:", j);

        //ding cheng input
        //ensure that frontend prevent crashes and remain in state of not being logined
        if (j?.user?.username) {
          setUser({
            username: j.user.username,
            email: j.user.email,
            dob: normalizeDob(j.user.dob),
            gender: normalizeGender(j.user.gender),
            actor: j.user.role === "Admin" ? "Admin" : "User",
            isPremium: !!j.user.isPremium,
          });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("AuthContext: hydration failed", err);
        setUser(null);
      } finally {
        setIsLoading(false);
        console.log("🏁 AuthContext: Session hydration complete");
      }
    })();
  }, []);

  useEffect(() => {
    try {
      if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      else localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      //added to console to check write
      console.error("Error from AuthContext: localStorage unable to write", err);
    }
  }, [user]);

  const signUp: AuthContextType["signUp"] = async ({ username, email, password, dob, gender }) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, dob, gender }),
    });
    const j = await res.json();
    //ding cheng input
    // add || 
    if (!res.ok) throw new Error(j.error || "Register failed");

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

      //ding cheng input 
      //

     const j = await res.json();
    if (!res.ok) throw new Error(j.error || "Invalid credentials");

      //ding cheng input
      //handle of supabase response with safety

// ✅ If Supabase login successful but /api/auth/me not hydrated yet
    if (j.ok && j.supabaseUserId && !j.user) {
      console.log("✅ Supabase login success — fetching fresh user profile...");
      const r = await fetch("/api/auth/me", { cache: "no-store" });
      const k = await r.json();
      if (k?.user?.username) {
        setUser({
          username: k.user.username,
          email: k.user.email,
          dob: normalizeDob(k.user.dob),
          gender: normalizeGender(k.user.gender),
          actor: k.user.role === "Admin" ? "Admin" : "User",
          isPremium: !!k.user.isPremium,
        });
      }
      return;
    }

    // ✅ Local login (immediate state update)
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
  };

  const signOut = () => {
    //ding cheng input
    //catch 
    fetch("/api/auth/signout", { method: "POST" }).catch(() => {});
    setUser(null);
    ////
    localStorage.removeItem(STORAGE_KEY);
  };

  const resetPassword: AuthContextType["resetPassword"] = async (email) => {
    void email;
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

    //ding cheng input

    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "Failed to update profile");

    setUser({
      username: j.user.username,
      email: j.user.email,
      dob: normalizeDob(j.user.dob),
      gender: normalizeGender(j.user.gender),
      actor: j.user.role === "Admin" ? "Admin" : "User",
      isPremium: !!j.user.isPremium,
    });
  };

  const setActor = (actor: Actor) => {
    setUser((prev) => (prev ? { ...prev, actor } : prev));
  };

  const value = useMemo<AuthContextType>(
    //ding cheng input
    () => ({ user, isAuthenticated: !!user, isLoading, signUp, signIn, signOut, resetPassword, updateProfile, setActor }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

