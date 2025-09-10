import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(_req: NextRequest, context: { params: { id: string } | Promise<{ id: string }> }) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const conn = await getConnection();
  const [rows]: any = await conn.execute(
    `SELECT id, name, description, category_id AS categoryId, seller_id AS sellerId, 
            listed, price, image_url AS imageUrl, image_urls AS imageUrls, 
            brand, size, condition_type AS conditionType, tags, 
            created_at AS createdAt FROM products WHERE id = ?`,
    [params.id]
  );
  await conn.end();
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  
  const product = rows[0];
  return NextResponse.json({
    ...product,
    price: typeof product.price === "string" ? Number(product.price) : product.price,
    listed: typeof product.listed === "number" ? product.listed === 1 : !!product.listed,
    imageUrls: product.imageUrls ? JSON.parse(product.imageUrls) : null,
    tags: product.tags ? JSON.parse(product.tags) : null,
  });
}

export async function PATCH(req: NextRequest, context: { params: { id: string } | Promise<{ id: string }> }) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  
  const body = await req.json().catch(() => ({}));
  const {
    name, description, categoryId, sellerId, listed, price,
    imageUrl, imageUrls, brand, size, conditionType, tags
  } = body;

  // Build dynamic update query
  const updates = [];
  const values = [];
  
  if (name !== undefined) { updates.push("name = ?"); values.push(name); }
  if (description !== undefined) { updates.push("description = ?"); values.push(description); }
  if (categoryId !== undefined) { updates.push("category_id = ?"); values.push(categoryId); }
  if (sellerId !== undefined) { updates.push("seller_id = ?"); values.push(sellerId); }
  if (listed !== undefined) { updates.push("listed = ?"); values.push(!!listed ? 1 : 0); }
  if (price !== undefined) { updates.push("price = ?"); values.push(price); }
  if (imageUrl !== undefined) { updates.push("image_url = ?"); values.push(imageUrl); }
  if (imageUrls !== undefined) { updates.push("image_urls = ?"); values.push(imageUrls ? JSON.stringify(imageUrls) : null); }
  if (brand !== undefined) { updates.push("brand = ?"); values.push(brand); }
  if (size !== undefined) { updates.push("size = ?"); values.push(size); }
  if (conditionType !== undefined) { updates.push("condition_type = ?"); values.push(conditionType); }
  if (tags !== undefined) { updates.push("tags = ?"); values.push(tags ? JSON.stringify(tags) : null); }
  
  if (updates.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }
  
  values.push(params.id);
  
  const conn = await getConnection();
  try {
    await conn.execute(`UPDATE products SET ${updates.join(", ")} WHERE id = ?`, values);
    
    const [rows]: any = await conn.execute(
      `SELECT id, name, description, category_id AS categoryId, seller_id AS sellerId, 
              listed, price, image_url AS imageUrl, image_urls AS imageUrls, 
              brand, size, condition_type AS conditionType, tags, 
              created_at AS createdAt FROM products WHERE id = ?`,
      [params.id]
    );
    
    await conn.end();
    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    
    const product = rows[0];
    return NextResponse.json({
      ...product,
      price: typeof product.price === "string" ? Number(product.price) : product.price,
      listed: typeof product.listed === "number" ? product.listed === 1 : !!product.listed,
      imageUrls: product.imageUrls ? JSON.parse(product.imageUrls) : null,
      tags: product.tags ? JSON.parse(product.tags) : null,
    });
  } catch (error) {
    await conn.end();
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: { params: { id: string } | Promise<{ id: string }> }) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const conn = await getConnection();
  const [res]: any = await conn.execute("DELETE FROM products WHERE id = ?", [params.id]);
  await conn.end();
  if (!res.affectedRows) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
