import { NextRequest, NextResponse } from "next/server";
import { getConnection, parseJson, toBoolean, toNumber } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

type TagList = string[];

type ImageList = string[];

function mapConditionOut(value: unknown): "new" | "like_new" | "good" | "fair" | "poor" | null {
  const normalized = String(value ?? "").toLowerCase();
  if (["new", "like_new", "good", "fair", "poor"].includes(normalized)) {
    return normalized as any;
  }
  return null;
}

function normalizeConditionIn(value: unknown): "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "POOR" {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"].includes(normalized)) {
    return normalized as any;
  }
  return "GOOD";
}

function mapStatus(value: unknown): "pending" | "paid" | "shipped" | "completed" | "cancelled" | null {
  const normalized = String(value ?? "").toLowerCase();
  if (["pending", "paid", "shipped", "completed", "cancelled"].includes(normalized)) {
    return normalized as any;
  }
  return null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const conn = await getConnection();
  const [rows]: any = await conn.execute(
    `SELECT l.id, l.name, l.description, l.category_id AS "categoryId", l.seller_id AS "sellerId",
            l.listed, l.sold, l.price, l.image_url AS "imageUrl", l.image_urls AS "imageUrls",
            l.brand, l.size, l.condition_type AS "conditionType", l.tags,
            l.created_at AS "createdAt", u.username AS "sellerName",
            t.id AS "txId", t.status AS "txStatus"
     FROM listings l
     LEFT JOIN users u ON l.seller_id = u.id
     LEFT JOIN transactions t ON t.listing_id = l.id
     ORDER BY l.id`
  );
  await conn.end();
  const listings = (rows as any[]).map((r) => ({
    ...r,
    id: String(r.id),
    categoryId: r.categoryId ? String(r.categoryId) : null,
    sellerId: r.sellerId ? String(r.sellerId) : null,
    price: toNumber(r.price) ?? 0,
    listed: toBoolean(r.listed),
    sold: toBoolean(r.sold),
    imageUrls: parseJson<ImageList>(r.imageUrls),
    tags: parseJson<TagList>(r.tags),
    conditionType: mapConditionOut(r.conditionType),
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    txStatus: mapStatus(r.txStatus),
    txId: r.txId ? String(r.txId) : null,
  }));
  return NextResponse.json({ listings });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const {
    name,
    description,
    categoryId,
    sellerId,
    listed = true,
    price,
    imageUrl,
    imageUrls,
    brand,
    size,
    conditionType,
    tags,
  } = body;

  if (!name || price === undefined || price === null) {
    return NextResponse.json({ error: "name and price are required" }, { status: 400 });
  }

  const conn = await getConnection();
  try {
    const [result]: any = await conn.execute(
      `INSERT INTO listings (name, description, category_id, seller_id, listed, price,
                            image_url, image_urls, brand, size, condition_type, tags, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        name,
        description ?? null,
        categoryId ? Number(categoryId) : null,
        sellerId ? Number(sellerId) : null,
        Boolean(listed),
        Number(price),
        imageUrl || null,
        imageUrls ? JSON.stringify(imageUrls) : null,
        brand || null,
        size || null,
        normalizeConditionIn(conditionType),
        tags ? JSON.stringify(tags) : null,
      ]
    );

    const [newListing]: any = await conn.execute(
      `SELECT id, name, description, category_id AS "categoryId", seller_id AS "sellerId",
              listed, price, image_url AS "imageUrl", image_urls AS "imageUrls",
              brand, size, condition_type AS "conditionType", tags,
              created_at AS "createdAt" FROM listings WHERE id = ?`,
      [result.insertId]
    );

    await conn.end();

    const listing = newListing[0];
    return NextResponse.json({
      ...listing,
      id: String(listing.id),
      categoryId: listing.categoryId ? String(listing.categoryId) : null,
      sellerId: listing.sellerId ? String(listing.sellerId) : null,
      price: toNumber(listing.price) ?? 0,
      listed: toBoolean(listing.listed),
      imageUrls: parseJson<ImageList>(listing.imageUrls),
      tags: parseJson<TagList>(listing.tags),
      conditionType: mapConditionOut(listing.conditionType),
      createdAt: listing.createdAt instanceof Date ? listing.createdAt.toISOString() : String(listing.createdAt),
    });
  } catch (error) {
    await conn.end();
    console.error("Error creating listing:", error);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
