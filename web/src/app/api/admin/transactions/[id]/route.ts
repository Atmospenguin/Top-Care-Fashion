import { NextRequest, NextResponse } from "next/server";
import { getConnection, toNumber } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function mapStatus(value: unknown): "pending" | "paid" | "shipped" | "completed" | "cancelled" {
  const normalized = String(value ?? "").toLowerCase();
  if (["pending", "paid", "shipped", "completed", "cancelled"].includes(normalized)) {
    return normalized as any;
  }
  return "pending";
}

function normalizeStatusIn(value: unknown): "PENDING" | "PAID" | "SHIPPED" | "COMPLETED" | "CANCELLED" {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (["PAID", "SHIPPED", "COMPLETED", "CANCELLED"].includes(normalized)) {
    return normalized as any;
  }
  return "PENDING";
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const conn = await getConnection();

  try {
    const [rows]: any = await conn.execute(
      `SELECT
        t.id, t.buyer_id AS "buyerId", t.seller_id AS "sellerId", t.listing_id AS "listingId",
        t.quantity, t.price_each AS "priceEach", t.status, t.created_at AS "createdAt",
        buyer.username AS "buyerName", buyer.email AS "buyerEmail",
        seller.username AS "sellerName", seller.email AS "sellerEmail",
        l.name AS "listingName", l.description AS "listingDescription",
        l.image_url AS "listingImageUrl", l.brand AS "listingBrand",
        l.size AS "listingSize", l.condition_type AS "listingCondition"
      FROM transactions t
      LEFT JOIN users buyer ON t.buyer_id = buyer.id
      LEFT JOIN users seller ON t.seller_id = seller.id
      LEFT JOIN listings l ON t.listing_id = l.id
      WHERE t.id = ?`,
      [Number(params.id)]
    );

    if (!rows.length) {
      await conn.end();
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const row = rows[0];
    const transaction = {
      ...row,
      id: String(row.id),
      buyerId: row.buyerId ? String(row.buyerId) : null,
      sellerId: row.sellerId ? String(row.sellerId) : null,
      listingId: row.listingId ? String(row.listingId) : null,
      quantity: toNumber(row.quantity) ?? 0,
      priceEach: toNumber(row.priceEach) ?? 0,
      status: mapStatus(row.status),
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      listingCondition: row.listingCondition ? String(row.listingCondition).toLowerCase() : null,
    };

    await conn.end();
    return NextResponse.json(transaction);
  } catch (error) {
    await conn.end();
    console.error("Error fetching transaction details:", error);
    return NextResponse.json({ error: "Failed to fetch transaction details" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const conn = await getConnection();

  try {
    const data = await req.json();
    const { status } = data ?? {};

    if (!status) {
      await conn.end();
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const normalizedStatus = normalizeStatusIn(status);

    await conn.execute("UPDATE transactions SET status = ? WHERE id = ?", [normalizedStatus, Number(params.id)]);

    if (normalizedStatus === "COMPLETED") {
      await conn.execute(
        `UPDATE listings
         SET sold = TRUE, listed = FALSE, sold_at = COALESCE(sold_at, NOW())
         WHERE id = (SELECT listing_id FROM transactions WHERE id = ?)`,
        [Number(params.id)]
      );
    }

    await conn.end();
    return NextResponse.json({ success: true });
  } catch (error) {
    await conn.end();
    console.error("Error updating transaction:", error);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}
