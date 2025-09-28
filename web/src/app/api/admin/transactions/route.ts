import { NextResponse } from "next/server";
import { getConnection, toNumber } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function mapStatus(value: unknown): "pending" | "paid" | "shipped" | "completed" | "cancelled" {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized === "paid" || normalized === "shipped" || normalized === "completed" || normalized === "cancelled") {
    return normalized as any;
  }
  return "pending";
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const conn = await getConnection();
  const [rows]: any = await conn.execute(
    `SELECT
      t.id, t.buyer_id AS "buyerId", t.seller_id AS "sellerId", t.listing_id AS "listingId",
      t.quantity, t.price_each AS "priceEach", t.status, t.created_at AS "createdAt",
      buyer.username AS "buyerName", seller.username AS "sellerName", l.name AS "listingName"
    FROM transactions t
    LEFT JOIN users buyer ON t.buyer_id = buyer.id
    LEFT JOIN users seller ON t.seller_id = seller.id
    LEFT JOIN listings l ON t.listing_id = l.id
    ORDER BY t.created_at DESC`
  );
  await conn.end();

  const transactions = (rows as any[]).map((row) => ({
    ...row,
    id: String(row.id),
    buyerId: String(row.buyerId),
    sellerId: String(row.sellerId),
    listingId: String(row.listingId),
    quantity: toNumber(row.quantity) ?? 0,
    priceEach: toNumber(row.priceEach) ?? 0,
    status: mapStatus(row.status),
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  }));

  return NextResponse.json({ transactions });
}
