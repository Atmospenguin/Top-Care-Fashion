import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const conn = await getConnection();
  const [rows] = await conn.execute(
    `SELECT 
      f.id, 
      f.user_id AS userId,
      f.user_email AS userEmail,
      f.question, 
      f.answer, 
      f.created_at AS createdAt, 
      f.answered_at AS answeredAt,
      u.username AS associatedUserName
    FROM faq f
    LEFT JOIN users u ON f.user_id = u.id
    ORDER BY f.id DESC`
  );
  await conn.end();
  return NextResponse.json({ faqs: rows });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { question, userEmail } = body || {};
  if (!question) return NextResponse.json({ error: "question required" }, { status: 400 });
  
  const conn = await getConnection();
  const [res]: any = await conn.execute(
    "INSERT INTO faq (user_id, user_email, question, created_at) VALUES (?, ?, ?, NOW())", 
    [user.id, userEmail || user.email, question]
  );
  const insertId = res.insertId;
  const [rows]: any = await conn.execute(
    `SELECT 
      f.id, 
      f.user_id AS userId,
      f.user_email AS userEmail,
      f.question, 
      f.answer, 
      f.created_at AS createdAt, 
      f.answered_at AS answeredAt,
      u.username AS associatedUserName
    FROM faq f
    LEFT JOIN users u ON f.user_id = u.id
    WHERE f.id = ?`,
    [insertId]
  );
  await conn.end();
  return NextResponse.json(rows[0]);
}
