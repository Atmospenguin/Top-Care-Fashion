import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(_req: NextRequest, context: { params: { id: string } | Promise<{ id: string }> }) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  
  const conn = await getConnection();
  
  try {
    // Get reviews received by this user (as reviewee)
    const [rows] = await conn.execute(
      `SELECT 
        r.id, r.transaction_id AS transactionId, r.reviewer_id AS reviewerId, 
        r.reviewee_id AS revieweeId, r.rating, r.comment, r.reviewer_type AS reviewerType,
        r.created_at AS createdAt,
        reviewer.username AS reviewerName, reviewee.username AS revieweeName,
        l.name AS listingName, l.id AS listingId
      FROM reviews r
      LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
      LEFT JOIN users reviewee ON r.reviewee_id = reviewee.id
      LEFT JOIN transactions t ON r.transaction_id = t.id
      LEFT JOIN listings l ON t.listing_id = l.id
      WHERE r.reviewee_id = ?
      ORDER BY r.created_at DESC`,
      [params.id]
    );
    
    // Get user's rating summary
    const [userRows] = await conn.execute(
      "SELECT average_rating, total_reviews FROM users WHERE id = ?",
      [params.id]
    );
    
    const userRating = (userRows as any[])[0] || { average_rating: null, total_reviews: 0 };
    
    await conn.end();
    return NextResponse.json({ 
      reviews: rows,
      averageRating: userRating.average_rating,
      totalReviews: userRating.total_reviews
    });
    
  } catch (error) {
    await conn.end();
    console.error("Error fetching user reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch user reviews" },
      { status: 500 }
    );
  }
}
