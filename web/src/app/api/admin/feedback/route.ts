import { NextRequest, NextResponse } from "next/server";
import { getConnection, parseJson, toBoolean, toNumber } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

type TagList = string[];

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const conn = await getConnection();
  const [rows]: any = await conn.execute(
    `SELECT
      f.id,
      f.user_id AS "userId",
      f.user_email AS "userEmail",
      f.user_name AS "userName",
      f.message,
      f.rating,
      f.tags,
      f.featured,
      f.created_at AS "createdAt",
      u.username AS "associatedUserName"
    FROM feedback f
    LEFT JOIN users u ON f.user_id = u.id
    ORDER BY f.id DESC`
  );
  await conn.end();

  const feedbacks = (rows as any[]).map((feedback) => ({
    ...feedback,
    id: String(feedback.id),
    userId: feedback.userId !== undefined && feedback.userId !== null ? String(feedback.userId) : undefined,
    rating: toNumber(feedback.rating),
    tags: parseJson<TagList>(feedback.tags) ?? [],
    featured: toBoolean(feedback.featured),
  }));

  return NextResponse.json({ feedbacks });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { userId, userEmail, userName, message, rating, tags, featured } = body ?? {};

    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    if (featured && !userName) {
      return NextResponse.json({ error: "userName is required for featured feedback" }, { status: 400 });
    }

    const connection = await getConnection();

    await connection.execute(
      `INSERT INTO feedback (user_id, user_email, user_name, message, rating, tags, featured, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId ? Number(userId) : null,
        userEmail || null,
        userName || null,
        message,
        rating !== undefined && rating !== null ? Number(rating) : null,
        tags ? JSON.stringify(tags) : null,
        Boolean(featured),
      ]
    );

    await connection.end();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding feedback:", error);
    return NextResponse.json({ error: "Failed to add feedback" }, { status: 500 });
  }
}
