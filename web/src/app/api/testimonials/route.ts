import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";

export async function GET() {
  try {
    const connection = await getConnection();
    
    const [testimonials] = await connection.execute(
      `SELECT id, user_name, text, rating, tags, created_at 
       FROM testimonials 
       WHERE featured = 1 
       ORDER BY created_at DESC`
    );
    
    await connection.end();
    
    // Parse JSON fields and format data for frontend
    const formattedTestimonials = (testimonials as any[]).map(t => ({
      id: t.id, // Use actual database ID instead of user_name
      user: t.user_name,
      text: t.text,
      rating: t.rating,
      tags: t.tags ? JSON.parse(t.tags) : [],
      ts: new Date(t.created_at).getTime()
    }));
    
    return NextResponse.json({ testimonials: formattedTestimonials });
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    return NextResponse.json(
      { error: "Failed to fetch testimonials" },
      { status: 500 }
    );
  }
}
