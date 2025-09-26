import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getConnection, toBoolean } from "@/lib/db";
import { createSupabaseServer } from "@/lib/supabase";

function mapRole(value: unknown): "User" | "Admin" {
  return String(value ?? "").toUpperCase() === "ADMIN" ? "Admin" : "User";
}

function mapStatus(value: unknown): "active" | "suspended" {
  return String(value ?? "").toUpperCase() === "SUSPENDED" ? "suspended" : "active";
}

function mapGender(value: unknown): "Male" | "Female" | null {
  const normalized = String(value ?? "").toUpperCase();
  if (!normalized) return null;
  if (normalized === "MALE") return "Male";
  if (normalized === "FEMALE") return "Female";
  return null;
}

export async function GET() {
  // Try Supabase session first
  const supabase = await createSupabaseServer();
  const { data: { user: sUser } } = await supabase.auth.getUser();
  const cookieStore = await cookies();
  const sid = cookieStore.get("tc_session")?.value;

  const conn = await getConnection();
  try {
    if (sUser?.id) {
      const [rows]: any = await conn.execute(
        "SELECT id, username, email, role, status, is_premium AS isPremium, premium_until AS premiumUntil, dob, gender FROM users WHERE supabase_user_id = ?",
        [sUser.id]
      );
      if (rows.length) {
        const row = rows[0];
        const user = {
          id: Number(row.id),
          username: row.username,
          email: row.email,
          role: mapRole(row.role),
          status: mapStatus(row.status),
          isPremium: toBoolean(row.isPremium),
          premiumUntil: row.premiumUntil ?? null,
          dob: row.dob ? (row.dob instanceof Date ? row.dob.toISOString().slice(0, 10) : String(row.dob)) : null,
          gender: mapGender(row.gender),
        };
        return NextResponse.json({ user, source: "supabase" });
      }
    }

    // Fallback to legacy cookie id
    if (sid) {
      const [rows]: any = await conn.execute(
        "SELECT id, username, email, role, status, is_premium AS isPremium, premium_until AS premiumUntil, dob, gender FROM users WHERE id = ?",
        [Number(sid)]
      );
      if (rows.length) {
        const row = rows[0];
        const user = {
          id: Number(row.id),
          username: row.username,
          email: row.email,
          role: mapRole(row.role),
          status: mapStatus(row.status),
          isPremium: toBoolean(row.isPremium),
          premiumUntil: row.premiumUntil ?? null,
          dob: row.dob ? (row.dob instanceof Date ? row.dob.toISOString().slice(0, 10) : String(row.dob)) : null,
          gender: mapGender(row.gender),
        };
        return NextResponse.json({ user, source: "legacy-cookie" });
      }
    }

    return NextResponse.json({ user: null });
  } finally {
    await conn.end();
  }
}
