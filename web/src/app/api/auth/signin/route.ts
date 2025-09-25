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

function mapGender(value: unknown): "Male" | "Female" | null {
  const normalized = String(value ?? "").toUpperCase();
  if (normalized === "MALE") return "Male";
  if (normalized === "FEMALE") return "Female";
  return null;
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "missing fields" }, { status: 400 });
  const conn = await getConnection();
  try {
    const [rows]: any = await conn.execute(
      "SELECT id, username, email, role, status, password_hash, is_premium AS isPremium, premium_until AS premiumUntil, dob, gender FROM users WHERE email = ?",
      [email]
    );
    if (!rows.length) return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
    const row = rows[0];
    if (row.password_hash && row.password_hash !== hash(password)) {
      return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
    }
    if (mapStatus(row.status) === "suspended") {
      return NextResponse.json({ error: "account suspended" }, { status: 403 });
    }
    let dob: string | null = null;
    if (row.dob) {
      dob = row.dob instanceof Date ? row.dob.toISOString().slice(0, 10) : String(row.dob);
    }
    const user = {
      id: Number(row.id),
      username: row.username,
      email: row.email,
      role: mapRole(row.role),
      status: mapStatus(row.status),
      dob,
      gender: mapGender(row.gender),
      isPremium: toBoolean(row.isPremium),
      premiumUntil: row.premiumUntil ?? null,
    };
    const res = NextResponse.json({ user });
    res.cookies.set("tc_session", String(user.id), { httpOnly: true, sameSite: "lax", path: "/" });
    return res;
  } finally {
    await conn.end();
  }
}
