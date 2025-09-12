import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";

// Public feedback endpoint: returns featured feedback items with rating
export async function GET() {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute(
      `SELECT id, user_name, message, rating, tags, created_at
       FROM feedback
       WHERE featured = 1 AND rating IS NOT NULL
       ORDER BY created_at DESC`
    );
    await connection.end();

    const testimonials = (rows as any[]).map((t) => ({
      id: t.id,
      user: t.user_name,
      text: t.message,
      rating: t.rating,
      tags: t.tags ? JSON.parse(t.tags) : [],
      ts: new Date(t.created_at).getTime(),
    }));

    return NextResponse.json({ testimonials });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}

