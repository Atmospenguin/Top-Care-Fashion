import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const conn = await getConnection();
  const [rows] = await conn.execute(
    "SELECT id, username, email, status, role, is_premium, premium_until, dob, gender, created_at AS createdAt FROM users ORDER BY created_at DESC"
  );
  await conn.end();
  return NextResponse.json({ users: rows });
}

