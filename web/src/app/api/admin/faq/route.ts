import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const conn = await getConnection();
  const [rows] = await conn.execute(
    "SELECT id, question, answer, created_at AS createdAt, answered_at AS answeredAt FROM faq ORDER BY id DESC"
  );
  await conn.end();
  return NextResponse.json({ faqs: rows });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const { id, answer } = body || {};
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const conn = await getConnection();
  await conn.execute("UPDATE faq SET answer = ?, answered_at = NOW() WHERE id = ?", [answer ?? null, id]);
  const [rows]: any = await conn.execute(
    "SELECT id, question, answer, created_at AS createdAt, answered_at AS answeredAt FROM faq WHERE id = ?",
    [id]
  );
  await conn.end();
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}
