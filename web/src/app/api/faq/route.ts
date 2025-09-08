import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const conn = await getConnection();
  const [rows] = await conn.execute(
    "SELECT id, question, answer, created_at AS createdAt, answered_at AS answeredAt FROM faq ORDER BY id DESC"
  );
  await conn.end();
  return NextResponse.json({ faqs: rows });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { question } = body || {};
  if (!question) return NextResponse.json({ error: "question required" }, { status: 400 });
  const conn = await getConnection();
  const [res]: any = await conn.execute("INSERT INTO faq (question, created_at) VALUES (?, NOW())", [question]);
  const insertId = res.insertId;
  const [rows]: any = await conn.execute(
    "SELECT id, question, answer, created_at AS createdAt, answered_at AS answeredAt FROM faq WHERE id = ?",
    [insertId]
  );
  await conn.end();
  return NextResponse.json(rows[0]);
}
