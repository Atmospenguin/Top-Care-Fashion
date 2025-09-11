import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(_req: NextRequest, context: { params: { id: string } | Promise<{ id: string }> }) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  
  const conn = await getConnection();
  
  try {
    // Get reviews for this transaction
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
      WHERE r.transaction_id = ?
      ORDER BY r.created_at DESC`,
      [params.id]
    );
    
    await conn.end();
    return NextResponse.json({ reviews: rows });
    
  } catch (error) {
    await conn.end();
    console.error("Error fetching transaction reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction reviews" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, context: { params: { id: string } | Promise<{ id: string }> }) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  
  try {
    const { reviewerId, revieweeId, rating, comment, reviewerType } = await req.json();
    
    if (!reviewerId || !revieweeId || !rating || !comment || !reviewerType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }
    
    if (!['buyer', 'seller'].includes(reviewerType)) {
      return NextResponse.json({ error: "Invalid reviewer type" }, { status: 400 });
    }
    
    const conn = await getConnection();
    
    try {
      // Verify transaction exists and reviewer is part of it
      const [transactionRows] = await conn.execute(
        "SELECT buyer_id, seller_id, status FROM transactions WHERE id = ?",
        [params.id]
      );
      
      if ((transactionRows as any[]).length === 0) {
        await conn.end();
        return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
      }
      
      const transaction = (transactionRows as any[])[0];
      
      // Verify reviewer is part of this transaction
      if (transaction.buyer_id != reviewerId && transaction.seller_id != reviewerId) {
        await conn.end();
        return NextResponse.json({ error: "Reviewer is not part of this transaction" }, { status: 403 });
      }
      
      // Verify reviewer type matches their role in transaction
      const expectedReviewerType = transaction.buyer_id == reviewerId ? 'buyer' : 'seller';
      if (reviewerType !== expectedReviewerType) {
        await conn.end();
        return NextResponse.json({ error: "Reviewer type doesn't match role in transaction" }, { status: 400 });
      }
      
      // Verify reviewee is the other party in transaction
      const expectedRevieweeId = transaction.buyer_id == reviewerId ? transaction.seller_id : transaction.buyer_id;
      if (revieweeId != expectedRevieweeId) {
        await conn.end();
        return NextResponse.json({ error: "Invalid reviewee for this transaction" }, { status: 400 });
      }
      
      // Check if review already exists
      const [existingRows] = await conn.execute(
        "SELECT id FROM reviews WHERE transaction_id = ? AND reviewer_id = ?",
        [params.id, reviewerId]
      );
      
      if ((existingRows as any[]).length > 0) {
        await conn.end();
        return NextResponse.json({ error: "Review already exists for this transaction and reviewer" }, { status: 400 });
      }
      
      // Insert the review
      const [result] = await conn.execute(
        `INSERT INTO reviews (transaction_id, reviewer_id, reviewee_id, rating, comment, reviewer_type) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [params.id, reviewerId, revieweeId, rating, comment, reviewerType]
      );
      
      await conn.end();
      return NextResponse.json({ 
        message: "Review created successfully",
        reviewId: (result as any).insertId 
      });
      
    } catch (error) {
      await conn.end();
      throw error;
    }
    
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
