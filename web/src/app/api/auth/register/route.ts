import { NextRequest, NextResponse } from "next/server";
import { getConnection, toBoolean } from "@/lib/db";
import crypto from "crypto";

function hash(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

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
  try {
    await conn.execute(
      "INSERT INTO users (username, email, password_hash, role, status, dob, gender) VALUES (?, ?, ?, 'USER', 'ACTIVE', ?, ?)",
      [username, email, hash(password), normalizedDob, mapGenderIn(normalizedGender)]
    );
    const [rows]: any = await conn.execute(
      "SELECT id, username, email, role, status, is_premium AS isPremium, premium_until AS premiumUntil, dob, gender FROM users WHERE email = ?",
      [email]
    );
    const row = rows[0];
    if (!row) {
      return NextResponse.json({ error: "Failed to load user" }, { status: 500 });
    }

    const user = {
      id: Number(row.id),
      username: row.username,
      email: row.email,
      role: mapRole(row.role),
      status: mapStatus(row.status),
      isPremium: toBoolean(row.isPremium),
      premiumUntil: row.premiumUntil ?? null,
      dob: row.dob ? (row.dob instanceof Date ? row.dob.toISOString().slice(0, 10) : String(row.dob)) : null,
      gender: mapGenderOut(row.gender),
    };

    const res = NextResponse.json({ user });
    res.cookies.set("tc_session", String(user.id), { httpOnly: true, sameSite: "lax", path: "/" });
    return res;
  } catch (e: any) {
    console.error("Register error:", e);
    return NextResponse.json({ error: e.message }, { status: 400 });
  } finally {
    await conn.end();
  }
}
