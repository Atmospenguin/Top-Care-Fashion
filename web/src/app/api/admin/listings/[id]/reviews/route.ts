import { NextResponse } from "next/server";
import { getConnection, toNumber } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function mapReviewerType(value: unknown): "buyer" | "seller" {
  return String(value ?? "").toUpperCase() === "SELLER" ? "seller" : "buyer";
}

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const conn = await getConnection();
  const [rows]: any = await conn.execute(
    `SELECT
      r.id,
      t.listing_id AS "listingId",
      r.reviewer_id AS "reviewerId",
      r.reviewee_id AS "revieweeId",
      r.rating,
      r.comment,
      r.transaction_id AS "transactionId",
      r.reviewer_type AS "reviewerType",
      r.created_at AS "createdAt",
      reviewer.username AS "reviewerName",
      reviewee.username AS "revieweeName"
    FROM reviews r
    INNER JOIN transactions t ON r.transaction_id = t.id
    LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
    LEFT JOIN users reviewee ON r.reviewee_id = reviewee.id
    WHERE t.listing_id = ?
    ORDER BY r.id DESC`,
    [Number(params.id)]
  );
  await conn.end();
  const reviews = (rows as any[]).map((row) => ({
    ...row,
    id: String(row.id),
    listingId: row.listingId ? String(row.listingId) : null,
    reviewerId: row.reviewerId ? String(row.reviewerId) : null,
    revieweeId: row.revieweeId ? String(row.revieweeId) : null,
    transactionId: row.transactionId ? String(row.transactionId) : null,
    rating: toNumber(row.rating) ?? 0,
    reviewerType: mapReviewerType(row.reviewerType),
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  }));
  return NextResponse.json({ reviews });
}
