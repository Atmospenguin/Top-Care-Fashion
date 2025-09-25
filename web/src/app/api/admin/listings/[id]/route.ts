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

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const conn = await getConnection();
  const [rows]: any = await conn.execute(
    `SELECT l.id, l.name, l.description, l.category_id AS "categoryId", l.seller_id AS "sellerId",
            l.listed, l.sold, l.price, l.image_url AS "imageUrl", l.image_urls AS "imageUrls",
            l.brand, l.size, l.condition_type AS "conditionType", l.tags,
            l.created_at AS "createdAt", l.sold_at AS "soldAt", u.username AS "sellerName",
            t.id AS "txId", t.status AS "txStatus"
     FROM listings l
     LEFT JOIN users u ON l.seller_id = u.id
     LEFT JOIN transactions t ON t.listing_id = l.id
     WHERE l.id = ?`,
    [Number(params.id)]
  );
  await conn.end();
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const listing = rows[0];
  return NextResponse.json({
    ...listing,
    id: String(listing.id),
    categoryId: listing.categoryId ? String(listing.categoryId) : null,
    sellerId: listing.sellerId ? String(listing.sellerId) : null,
    price: toNumber(listing.price) ?? 0,
    listed: toBoolean(listing.listed),
    sold: toBoolean(listing.sold),
    imageUrls: parseJson<ImageList>(listing.imageUrls),
    tags: parseJson<TagList>(listing.tags),
    conditionType: mapConditionOut(listing.conditionType),
    createdAt: listing.createdAt instanceof Date ? listing.createdAt.toISOString() : String(listing.createdAt),
    soldAt: listing.soldAt ? (listing.soldAt instanceof Date ? listing.soldAt.toISOString() : String(listing.soldAt)) : null,
    txStatus: mapStatus(listing.txStatus),
    txId: listing.txId ? String(listing.txId) : null,
  });
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const {
    name,
    description,
    categoryId,
    sellerId,
    listed,
    price,
    imageUrl,
    imageUrls,
    brand,
    size,
    conditionType,
    tags,
  } = body ?? {};

  const updates: string[] = [];
  const values: Array<string | number | boolean | null> = [];

  if (name !== undefined) { updates.push("name = ?"); values.push(name); }
  if (description !== undefined) { updates.push("description = ?"); values.push(description ?? null); }
  if (categoryId !== undefined) { updates.push("category_id = ?"); values.push(categoryId ? Number(categoryId) : null); }
  if (sellerId !== undefined) { updates.push("seller_id = ?"); values.push(sellerId ? Number(sellerId) : null); }
  if (listed !== undefined) { updates.push("listed = ?"); values.push(Boolean(listed)); }
  if (price !== undefined) { updates.push("price = ?"); values.push(Number(price)); }
  if (imageUrl !== undefined) { updates.push("image_url = ?"); values.push(imageUrl ?? null); }
  if (imageUrls !== undefined) { updates.push("image_urls = ?"); values.push(imageUrls ? JSON.stringify(imageUrls) : null); }
  if (brand !== undefined) { updates.push("brand = ?"); values.push(brand ?? null); }
  if (size !== undefined) { updates.push("size = ?"); values.push(size ?? null); }
  if (conditionType !== undefined) { updates.push("condition_type = ?"); values.push(normalizeConditionIn(conditionType)); }
  if (tags !== undefined) { updates.push("tags = ?"); values.push(tags ? JSON.stringify(tags) : null); }

  if (updates.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  values.push(Number(params.id));

  const conn = await getConnection();
  try {
    await conn.execute(`UPDATE listings SET ${updates.join(", ")} WHERE id = ?`, values);

    const [rows]: any = await conn.execute(
      `SELECT id, name, description, category_id AS "categoryId", seller_id AS "sellerId",
              listed, price, image_url AS "imageUrl", image_urls AS "imageUrls",
              brand, size, condition_type AS "conditionType", tags,
              created_at AS "createdAt"
       FROM listings WHERE id = ?`,
      [Number(params.id)]
    );

    await conn.end();
    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const listing = rows[0];
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
    console.error("Error updating listing:", error);
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const conn = await getConnection();
  try {
    const [res]: any = await conn.execute("DELETE FROM listings WHERE id = ?", [Number(params.id)]);
    await conn.end();
    if (!res.affectedRows) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    const message = String(error?.message ?? "");
    const isFk = message.includes("violates foreign key constraint") || message.includes("23503");
    if (isFk) {
      try {
        await conn.execute("UPDATE listings SET listed = FALSE WHERE id = ?", [Number(params.id)]);
        await conn.end();
        return NextResponse.json({ ok: true, softDeleted: true });
      } catch (e) {
        await conn.end();
        return NextResponse.json({ error: "Failed to unlist listing" }, { status: 500 });
      }
    }
    await conn.end();
    return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 });
  }
}
