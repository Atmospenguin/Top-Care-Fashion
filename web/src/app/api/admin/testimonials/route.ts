import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { user, text, rating, tags, featured } = body;

    if (!user || !text) {
      return NextResponse.json(
        { error: "user and text are required" },
        { status: 400 }
      );
    }

    const connection = await getConnection();
    
    await connection.execute(
      `INSERT INTO feedback (user_name, message, rating, tags, featured, feedback_type, created_at) 
       VALUES (?, ?, ?, ?, ?, 'testimonial', NOW())`,
      [
        user, 
        text, 
        rating || 5, 
        tags ? JSON.stringify(tags) : null, 
        featured ? 1 : 0
      ]
    );
    
    await connection.end();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding testimonial:", error);
    return NextResponse.json(
      { error: "Failed to add testimonial" },
      { status: 500 }
    );
  }
}
