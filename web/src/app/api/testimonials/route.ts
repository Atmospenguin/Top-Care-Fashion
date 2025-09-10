import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";

export async function GET() {
  try {
    const connection = await getConnection();
    
    const [testimonials] = await connection.execute(
      `SELECT id, user_name, message, rating, tags, created_at 
       FROM feedback 
       WHERE feedback_type = 'testimonial' AND featured = 1 
       ORDER BY created_at DESC`
    );
    
    await connection.end();
    
    // Parse JSON fields and format data for frontend (maintaining backward compatibility)
    const formattedTestimonials = (testimonials as any[]).map(t => ({
      id: t.id,
      user: t.user_name,
      text: t.message, // Map message to text for backward compatibility
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
