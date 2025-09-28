import { NextRequest, NextResponse } from "next/server";
import { getConnection, toNumber } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function mapReviewerType(value: unknown): "buyer" | "seller" {
  return String(value ?? "").toUpperCase() === "SELLER" ? "seller" : "buyer";
}

function normalizeReviewerType(value: string): "BUYER" | "SELLER" {
  return value === "seller" ? "SELLER" : "BUYER";
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
      WHERE r.transaction_id = ?
      ORDER BY r.created_at DESC`,
      [Number(params.id)]
    );

    await conn.end();

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

    return NextResponse.json({ reviews });
  } catch (error) {
    await conn.end();
    console.error("Error fetching transaction reviews:", error);
    return NextResponse.json({ error: "Failed to fetch transaction reviews" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { reviewerId, revieweeId, rating, comment, reviewerType } = await req.json();

    if (!reviewerId || !revieweeId || !rating || !comment || !reviewerType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (Number(rating) < 1 || Number(rating) > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    if (!["buyer", "seller"].includes(reviewerType)) {
      return NextResponse.json({ error: "Invalid reviewer type" }, { status: 400 });
    }

    const conn = await getConnection();

    try {
      const [transactionRows]: any = await conn.execute(
        "SELECT buyer_id, seller_id, status FROM transactions WHERE id = ?",
        [Number(params.id)]
      );

      if (!Array.isArray(transactionRows) || transactionRows.length === 0) {
        await conn.end();
        return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
      }

      const transaction = transactionRows[0];

      if (transaction.buyer_id != reviewerId && transaction.seller_id != reviewerId) {
        await conn.end();
        return NextResponse.json({ error: "Reviewer is not part of this transaction" }, { status: 403 });
      }

      const expectedReviewerType = transaction.buyer_id == reviewerId ? "buyer" : "seller";
      if (reviewerType !== expectedReviewerType) {
        await conn.end();
        return NextResponse.json({ error: "Reviewer type doesn't match role in transaction" }, { status: 400 });
      }

      const expectedRevieweeId = transaction.buyer_id == reviewerId ? transaction.seller_id : transaction.buyer_id;
      if (revieweeId != expectedRevieweeId) {
        await conn.end();
        return NextResponse.json({ error: "Invalid reviewee for this transaction" }, { status: 400 });
      }

      const [existingRows]: any = await conn.execute(
        "SELECT id FROM reviews WHERE transaction_id = ? AND reviewer_id = ?",
        [Number(params.id), reviewerId]
      );

      if (Array.isArray(existingRows) && existingRows.length > 0) {
        await conn.end();
        return NextResponse.json({ error: "Review already exists for this transaction and reviewer" }, { status: 400 });
      }

      const [result]: any = await conn.execute(
        `INSERT INTO reviews (transaction_id, reviewer_id, reviewee_id, rating, comment, reviewer_type)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [Number(params.id), reviewerId, revieweeId, Number(rating), comment, normalizeReviewerType(reviewerType)]
      );

      await conn.end();
      return NextResponse.json({
        message: "Review created successfully",
        reviewId: (result as any).insertId,
      });
    } catch (error) {
      await conn.end();
      throw error;
    }
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
