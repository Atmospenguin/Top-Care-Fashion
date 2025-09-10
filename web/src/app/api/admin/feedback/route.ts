import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const conn = await getConnection();
  const [rows] = await conn.execute(
    `SELECT 
      id, 
      user_email AS userEmail, 
      user_name AS userName,
      message, 
      rating,
      tags,
      featured,
      feedback_type AS feedbackType,
      created_at AS createdAt 
    FROM feedback 
    ORDER BY id DESC`
  );
  await conn.end();
  
  // Format the response to parse JSON fields
  const feedbacks = (rows as any[]).map(feedback => ({
    ...feedback,
    tags: feedback.tags ? JSON.parse(feedback.tags) : [],
    featured: !!feedback.featured
  }));
  
  return NextResponse.json({ feedbacks });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { userEmail, userName, message, rating, tags, featured, feedbackType } = body;

    if (!message) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    // Validate testimonial-specific fields
    if (feedbackType === 'testimonial' && !userName) {
      return NextResponse.json(
        { error: "userName is required for testimonials" },
        { status: 400 }
      );
    }

    const connection = await getConnection();
    
    await connection.execute(
      `INSERT INTO feedback (user_email, user_name, message, rating, tags, featured, feedback_type, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        userEmail || null,
        userName || null,
        message,
        rating || null,
        tags ? JSON.stringify(tags) : null,
        featured ? 1 : 0,
        feedbackType || 'feedback'
      ]
    );
    
    await connection.end();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding feedback:", error);
    return NextResponse.json(
      { error: "Failed to add feedback" },
      { status: 500 }
    );
  }
}
