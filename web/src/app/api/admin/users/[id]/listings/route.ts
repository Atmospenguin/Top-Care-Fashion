import { NextRequest, NextResponse } from "next/server";
import { getConnection, parseJson, toBoolean, toNumber } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

type TagList = string[];

type ImageList = string[];

function mapCondition(value: unknown): "new" | "like_new" | "good" | "fair" | "poor" | undefined {
  const normalized = String(value ?? "").toLowerCase();
  if (!normalized) return undefined;
  if (["new", "like_new", "good", "fair", "poor"].includes(normalized)) {
    return normalized as any;
  }
  return undefined;
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const conn = await getConnection();

  try {
    const [rows]: any = await conn.execute(
      `SELECT
        id, name, description, category_id AS "categoryId", seller_id AS "sellerId",
        listed, price, image_url AS "imageUrl", image_urls AS "imageUrls",
        brand, size, condition_type AS "conditionType", tags,
        created_at AS "createdAt"
      FROM listings
      WHERE seller_id = ?
      ORDER BY created_at DESC`,
      [Number(params.id)]
    );

    const listings = (rows as any[]).map((row) => ({
      ...row,
      id: String(row.id),
      categoryId: row.categoryId ? String(row.categoryId) : null,
      sellerId: row.sellerId ? String(row.sellerId) : null,
      price: toNumber(row.price) ?? 0,
      listed: toBoolean(row.listed),
      imageUrls: parseJson<ImageList>(row.imageUrls),
      tags: parseJson<TagList>(row.tags),
      conditionType: mapCondition(row.conditionType),
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    }));

    await conn.end();
    return NextResponse.json({ listings });
  } catch (error) {
    await conn.end();
    console.error("Error fetching user listings:", error);
    return NextResponse.json({ error: "Failed to fetch user listings" }, { status: 500 });
  }
}
