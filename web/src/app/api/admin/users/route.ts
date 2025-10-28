import { NextResponse } from "next/server";
import { getConnection, toBoolean } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

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

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const conn = await getConnection();
  const [rows]: any = await conn.execute(
    "SELECT id, username, email, status, role, is_premium, premium_until, dob, gender, created_at AS \"createdAt\" FROM users ORDER BY created_at DESC"
  );
  await conn.end();

  const users = (rows as any[]).map((row) => ({
    id: String(row.id),
    username: row.username,
    email: row.email,
    status: mapStatus(row.status),
    role: mapRole(row.role),
    is_premium: toBoolean(row.is_premium),
    premium_until: row.premium_until ?? null,
    dob: row.dob ? (row.dob instanceof Date ? row.dob.toISOString().slice(0, 10) : String(row.dob)) : null,
    gender: mapGender(row.gender),
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  }));

  return NextResponse.json({ users });
}
