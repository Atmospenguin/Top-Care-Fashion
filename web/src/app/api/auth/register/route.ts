import { NextRequest, NextResponse } from "next/server";
import { getConnection, toBoolean } from "@/lib/db";
import { createSupabaseServer } from "@/lib/supabase";

function mapRole(value: unknown): "User" | "Admin" {
  return String(value ?? "").toUpperCase() === "ADMIN" ? "Admin" : "User";
}

function mapStatus(value: unknown): "active" | "suspended" {
  return String(value ?? "").toUpperCase() === "SUSPENDED" ? "suspended" : "active";
}

function mapGenderOut(value: unknown): "Male" | "Female" | null {
  const normalized = String(value ?? "").toUpperCase();
  if (normalized === "MALE") return "Male";
  if (normalized === "FEMALE") return "Female";
  return null;
}

function mapGenderIn(value: "Male" | "Female" | null): "MALE" | "FEMALE" | null {
  if (!value) return null;
  return value === "Male" ? "MALE" : "FEMALE";
}

export async function POST(req: NextRequest) {
  const { username, email, password, dob, gender } = await req.json();
  if (!username || !email || !password) return NextResponse.json({ error: "missing fields" }, { status: 400 });

  const trimmedDob = typeof dob === "string" ? dob.trim() : "";
  let normalizedDob: string | null = null;
  if (trimmedDob) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedDob)) {
      return NextResponse.json({ error: "invalid dob" }, { status: 400 });
    }
    normalizedDob = trimmedDob;
  }

  let normalizedGender: "Male" | "Female" | null = null;
  if (typeof gender === "string" && gender.trim()) {
    const normalized = gender.trim();
    if (normalized !== "Male" && normalized !== "Female") {
      return NextResponse.json({ error: "invalid gender" }, { status: 400 });
    }
    normalizedGender = normalized as "Male" | "Female";
  }

  const conn = await getConnection();
  const supabase = createSupabaseServer();
  try {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          dob: normalizedDob,
          gender: normalizedGender,
        },
      },
    });
    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }

    const supaUser = signUpData.user;
    if (!supaUser) {
      return NextResponse.json({ error: "Sign up failed" }, { status: 500 });
    }

    // Upsert local user row (for admin dashboards, etc.)
    try {
      await conn.execute(
        "INSERT INTO users (username, email, role, status, dob, gender, supabase_user_id, is_premium) VALUES (?, ?, 'USER', 'ACTIVE', ?, ?, ?, false)",
        [
          username,
          email,
          normalizedDob,
          mapGenderIn(normalizedGender),
          supaUser.id,
        ]
      );
    } catch (insertError: any) {
      if (insertError?.message?.includes("users_email_key") || insertError?.message?.includes("duplicate key")) {
        return NextResponse.json({ error: "Email already registered" }, { status: 409 });
      }
      throw insertError;
    }

    // Hydrate user info for response
    const [rows]: any = await conn.execute(
      "SELECT id, username, email, role, status, is_premium AS isPremium, premium_until AS premiumUntil, dob, gender FROM users WHERE supabase_user_id = ?",
      [supaUser.id]
    );
    const row = rows[0];
    const user = row
      ? {
          id: Number(row.id),
          username: row.username,
          email: row.email,
          role: mapRole(row.role),
          status: mapStatus(row.status),
          isPremium: toBoolean(row.isPremium),
          premiumUntil: row.premiumUntil ?? null,
          dob: row.dob ? (row.dob instanceof Date ? row.dob.toISOString().slice(0, 10) : String(row.dob)) : null,
          gender: mapGenderOut(row.gender),
        }
      : null;

    return NextResponse.json({ user, requiresConfirmation: !supaUser.email_confirmed_at });
  } catch (e: any) {
    console.error("Register error:", e);
    return NextResponse.json({ error: e.message }, { status: 400 });
  } finally {
    await conn.end();
  }
}
