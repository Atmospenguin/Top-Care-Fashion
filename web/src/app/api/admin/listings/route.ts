import { NextRequest, NextResponse } from "next/server";
import { getConnection, parseJson, toBoolean, toNumber } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

type ImageList = string[];

const LISTING_SELECT = `
  SELECT l.id,
         l.name,
         l.description,
         l.category_id AS "categoryId",
         l.seller_id AS "sellerId",
         l.listed,
         l.sold,
         l.price,
         l.image_url AS "imageUrl",
         l.image_urls AS "imageUrls",
         l.brand,
         l.size,
         l.condition_type AS "conditionType",
         l.tags,
         l.created_at AS "createdAt",
         l.sold_at AS "soldAt",
         l.updated_at AS "updatedAt",
         u.username AS "sellerName",
         tx.id AS "txId",
         tx.status AS "txStatus"
    FROM listings l
    LEFT JOIN users u ON l.seller_id = u.id
    LEFT JOIN LATERAL (
      SELECT o.id, o.status
        FROM orders o
       WHERE o.listing_id = l.id
       ORDER BY o.created_at DESC
       LIMIT 1
    ) tx ON TRUE
`;

function ensureStringArray(value: unknown): string[] {
  if (!value) return [];
  const parsed = Array.isArray(value) ? (value as unknown[]) : parseJson<ImageList>(value);
  if (!parsed || !Array.isArray(parsed)) return [];
  return parsed.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function mapListingRow(row: any) {
  const imageUrls = ensureStringArray(row.imageUrls);
  const tags = ensureStringArray(row.tags);

  return {
    id: String(row.id),
    name: row.name,
    description: row.description ?? null,
    categoryId: row.categoryId ? String(row.categoryId) : null,
    sellerId: row.sellerId ? String(row.sellerId) : null,
    sellerName: row.sellerName ?? null,
    listed: toBoolean(row.listed),
    sold: toBoolean(row.sold),
    price: toNumber(row.price) ?? 0,
    imageUrl: row.imageUrl ?? null,
    imageUrls,
    brand: row.brand ?? null,
    size: row.size ?? null,
    conditionType: mapConditionOut(row.conditionType),
    tags,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    soldAt: row.soldAt ? (row.soldAt instanceof Date ? row.soldAt.toISOString() : String(row.soldAt)) : null,
    txStatus: mapStatus(row.txStatus),
    txId: row.txId ? String(row.txId) : null,
  };
}

async function fetchListingById(conn: Awaited<ReturnType<typeof getConnection>>, id: number) {
  const [rows]: any = await conn.execute(`${LISTING_SELECT} WHERE l.id = ? ORDER BY l.id`, [id]);
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }
  return mapListingRow(rows[0]);
}

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
  const normalized = String(value ?? "").trim().toUpperCase();
  switch (normalized) {
    case "IN_PROGRESS":
      return "pending";
    case "TO_SHIP":
      return "paid";
    case "SHIPPED":
    case "DELIVERED":
      return "shipped";
    case "RECEIVED":
    case "COMPLETED":
    case "REVIEWED":
      return "completed";
    case "CANCELLED":
      return "cancelled";
    default:
      return null;
  }
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const conn = await getConnection();
  const [rows]: any = await conn.execute(`${LISTING_SELECT} ORDER BY l.id`);
  await conn.end();
  const listings = (rows as any[]).map(mapListingRow);
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

    const listing = await fetchListingById(conn, Number(result.insertId));

    await conn.end();

    if (!listing) {
      return NextResponse.json({ error: "Failed to fetch created listing" }, { status: 500 });
    }

    return NextResponse.json(listing);
  } catch (error) {
    await conn.end();
    console.error("Error creating listing:", error);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
