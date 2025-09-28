import { NextRequest, NextResponse } from "next/server";
import { getConnection, toNumber } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function mapReviewerType(value: unknown): "buyer" | "seller" {
  return String(value ?? "").toUpperCase() === "SELLER" ? "seller" : "buyer";
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const conn = await getConnection();

  try {
    const [rows]: any = await conn.execute(
      `SELECT
        r.id, r.transaction_id AS "transactionId", r.reviewer_id AS "reviewerId",
        r.reviewee_id AS "revieweeId", r.rating, r.comment, r.reviewer_type AS "reviewerType",
        r.created_at AS "createdAt",
        reviewer.username AS "reviewerName", reviewee.username AS "revieweeName",
        l.name AS "listingName", l.id AS "listingId"
      FROM reviews r
      LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
      LEFT JOIN users reviewee ON r.reviewee_id = reviewee.id
      LEFT JOIN transactions t ON r.transaction_id = t.id
      LEFT JOIN listings l ON t.listing_id = l.id
      WHERE r.reviewee_id = ?
      ORDER BY r.created_at DESC`,
      [Number(params.id)]
    );

    const [userRows]: any = await conn.execute(
      "SELECT average_rating, total_reviews FROM users WHERE id = ?",
      [Number(params.id)]
    );

    await conn.end();

    const userRating = Array.isArray(userRows) && userRows.length ? userRows[0] : { average_rating: null, total_reviews: 0 };

    const reviews = (rows as any[]).map((row) => ({
      ...row,
      id: String(row.id),
      transactionId: String(row.transactionId),
      reviewerId: String(row.reviewerId),
      revieweeId: String(row.revieweeId),
      rating: toNumber(row.rating) ?? 0,
      reviewerType: mapReviewerType(row.reviewerType),
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      listingId: row.listingId ? String(row.listingId) : null,
    }));

    return NextResponse.json({
      reviews,
      averageRating: toNumber(userRating.average_rating),
      totalReviews: toNumber(userRating.total_reviews) ?? 0,
    });
  } catch (error) {
    await conn.end();
    console.error("Error fetching user reviews:", error);
    return NextResponse.json({ error: "Failed to fetch user reviews" }, { status: 500 });
  }
}
