import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const conn = await getConnection();
  const [rows] = await conn.execute(
    "SELECT id, user_email AS userEmail, message, created_at AS createdAt FROM feedback ORDER BY id DESC"
  );
  await conn.end();
  return NextResponse.json({ feedbacks: rows });
}
