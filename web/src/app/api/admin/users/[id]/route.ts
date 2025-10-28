import { NextRequest, NextResponse } from "next/server";
import { getConnection, toBoolean, toNumber } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

type DbUser = {
  id: number | string;
  username: string;
  email: string;
  status: string;
  role: string;
  is_premium: boolean | number | null;
  premium_until: Date | string | null;
  dob: Date | string | null;
  gender: string | null;
  average_rating: unknown;
  total_reviews: unknown;
  createdAt: Date | string;
  avatar_url?: string | null;
};

function mapRoleOut(value: unknown): "User" | "Admin" {
  return String(value ?? "").toUpperCase() === "ADMIN" ? "Admin" : "User";
}

function mapStatusOut(value: unknown): "active" | "suspended" {
  return String(value ?? "").toUpperCase() === "SUSPENDED" ? "suspended" : "active";
}

function mapGenderOut(value: unknown): "Male" | "Female" | null {
  const normalized = String(value ?? "").toUpperCase();
  if (normalized === "MALE") return "Male";
  if (normalized === "FEMALE") return "Female";
  return null;
}

function normalizeStatusIn(value: unknown): "ACTIVE" | "SUSPENDED" {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === "SUSPENDED") return "SUSPENDED";
  return "ACTIVE";
}

function normalizeRoleIn(value: unknown): "USER" | "ADMIN" {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === "ADMIN") return "ADMIN";
  return "USER";
}

function normalizePremium(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase();
    return trimmed === "1" || trimmed === "true";
  }
  return false;
}

function normalizeGenderIn(value: unknown): "MALE" | "FEMALE" | null {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;
  if (normalized === "Male" || normalized.toUpperCase() === "MALE") return "MALE";
  if (normalized === "Female" || normalized.toUpperCase() === "FEMALE") return "FEMALE";
  return null;
}

function toIso(value: Date | string | null): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const asDate = new Date(value);
  return Number.isNaN(asDate.getTime()) ? String(value) : asDate.toISOString();
}

function toDateOnly(value: Date | string | null): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

function formatUser(row: DbUser) {
  return {
    id: String(row.id),
    username: row.username,
    email: row.email,
    status: mapStatusOut(row.status),
    role: mapRoleOut(row.role),
    is_premium: toBoolean(row.is_premium),
    premium_until: toIso(row.premium_until),
    dob: toDateOnly(row.dob),
    gender: mapGenderOut(row.gender),
    average_rating: toNumber(row.average_rating),
    total_reviews: toNumber(row.total_reviews) ?? 0,
    createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
    avatar_url: row.avatar_url ?? null,
  };
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const conn = await getConnection();
  const [rows]: any = await conn.execute(
    "SELECT id, username, email, status, role, is_premium, premium_until, dob, gender, average_rating, total_reviews, avatar_url, created_at AS \"createdAt\" FROM users WHERE id = ?",
    [Number(params.id)]
  );
  await conn.end();
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(formatUser(rows[0]));
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json().catch(() => ({}));
    const { username, email, role, status, is_premium, gender } = body ?? {};
    const userId = Number(params.id);

    if (status && Object.keys(body).length === 1) {
      const normalized = String(status).trim().toUpperCase();
      if (normalized !== "ACTIVE" && normalized !== "SUSPENDED") {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      const conn = await getConnection();
      await conn.execute("UPDATE users SET status = ? WHERE id = ?", [normalized, userId]);
      const [rows]: any = await conn.execute(
        "SELECT id, username, email, status, role, is_premium, premium_until, dob, gender, average_rating, total_reviews, avatar_url, created_at AS \"createdAt\" FROM users WHERE id = ?",
        [userId]
      );
      await conn.end();
      if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(formatUser(rows[0]));
    }

    const updates: string[] = [];
    const values: Array<string | number | boolean | null> = [];

    if (username !== undefined) {
      updates.push("username = ?");
      values.push(username);
    }
    if (email !== undefined) {
      updates.push("email = ?");
      values.push(email);
    }
    if (role !== undefined) {
      updates.push("role = ?");
      values.push(normalizeRoleIn(role));
    }
    if (status !== undefined) {
      updates.push("status = ?");
      values.push(normalizeStatusIn(status));
    }
    if (is_premium !== undefined) {
      updates.push("is_premium = ?");
      values.push(normalizePremium(is_premium));
    }
    if (gender !== undefined) {
      updates.push("gender = ?");
      values.push(normalizeGenderIn(gender));
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(userId);
    const conn = await getConnection();
    await conn.execute(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);

    const [rows]: any = await conn.execute(
      "SELECT id, username, email, status, role, is_premium, premium_until, dob, gender, average_rating, total_reviews, avatar_url, created_at AS \"createdAt\" FROM users WHERE id = ?",
      [userId]
    );
    await conn.end();

    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(formatUser(rows[0]));
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
