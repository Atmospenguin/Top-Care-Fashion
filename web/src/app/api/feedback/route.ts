import { NextResponse } from "next/server";
import { getConnection, parseJson, toNumber } from "@/lib/db";

export async function GET() {
  try {
    const connection = await getConnection();
    const [rows]: any = await connection.execute(
      `SELECT id, user_name, message, rating, tags, created_at
       FROM feedback
       WHERE featured = TRUE AND rating IS NOT NULL
       ORDER BY created_at DESC`
    );
    await connection.end();

    const testimonials = (rows as any[]).map((t) => ({
      id: Number(t.id),
      user: t.user_name,
      text: t.message,
      rating: toNumber(t.rating) ?? 0,
      tags: parseJson<string[]>(t.tags) ?? [],
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
