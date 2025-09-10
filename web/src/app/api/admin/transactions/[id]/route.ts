import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(_req: NextRequest, context: { params: { id: string } | Promise<{ id: string }> }) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  
  const conn = await getConnection();
  
  try {
    // Get transaction details with buyer/seller/listing info
    const [rows]: any = await conn.execute(
      `SELECT 
        t.id, t.buyer_id AS buyerId, t.seller_id AS sellerId, t.listing_id AS listingId,
        t.quantity, t.price_each AS priceEach, t.status, t.created_at AS createdAt,
        buyer.username AS buyerName, buyer.email AS buyerEmail,
        seller.username AS sellerName, seller.email AS sellerEmail,
        l.name AS listingName, l.description AS listingDescription,
        l.image_url AS listingImageUrl, l.brand AS listingBrand,
        l.size AS listingSize, l.condition_type AS listingCondition
      FROM transactions t
      LEFT JOIN users buyer ON t.buyer_id = buyer.id
      LEFT JOIN users seller ON t.seller_id = seller.id  
      LEFT JOIN listings l ON t.listing_id = l.id
      WHERE t.id = ?`,
      [params.id]
    );
    
    if (!rows.length) {
      await conn.end();
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    
    const transaction = {
      ...rows[0],
      priceEach: Number(rows[0].priceEach),
      createdAt: rows[0].createdAt
    };
    
    await conn.end();
    return NextResponse.json(transaction);
    
  } catch (error) {
    await conn.end();
    console.error("Error fetching transaction details:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction details" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, context: { params: { id: string } | Promise<{ id: string }> }) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  
  const conn = await getConnection();
  
  try {
    const data = await req.json();
    const { status } = data;
    
    if (!status) {
      await conn.end();
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }
    
    // Update transaction status
    await conn.execute(
      "UPDATE transactions SET status = ? WHERE id = ?",
      [status, params.id]
    );
    
    await conn.end();
    return NextResponse.json({ success: true });
    
  } catch (error) {
    await conn.end();
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}
