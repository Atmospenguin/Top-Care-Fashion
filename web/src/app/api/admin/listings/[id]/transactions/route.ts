import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(_req: Request, context: { params: { id: string } | Promise<{ id: string }> }) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  
  const conn = await getConnection();
  const [rows] = await conn.execute(
    `SELECT 
      t.id, t.buyer_id AS buyerId, t.seller_id AS sellerId, t.listing_id AS listingId,
      t.quantity, t.price_each AS priceEach, t.status, t.created_at AS createdAt,
      buyer.username AS buyerName, seller.username AS sellerName, l.name AS listingName
    FROM transactions t
    LEFT JOIN users buyer ON t.buyer_id = buyer.id
    LEFT JOIN users seller ON t.seller_id = seller.id  
    LEFT JOIN listings l ON t.listing_id = l.id
    WHERE t.listing_id = ? 
    ORDER BY t.created_at DESC`,
    [params.id]
  );
  await conn.end();
  return NextResponse.json({ transactions: rows });
}
