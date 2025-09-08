import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const conn = await getConnection();
  const [rows]: any = await conn.execute(
    `SELECT id, name, description, category_id AS categoryId, seller_id AS sellerId, 
            listed, price, image_url AS imageUrl, image_urls AS imageUrls, 
            brand, size, condition_type AS conditionType, tags, 
            created_at AS createdAt FROM products ORDER BY id`
  );
  await conn.end();
  const products = (rows || []).map((r: any) => ({
    ...r,
    // mysql2 returns DECIMAL as string by default; ensure number for UI formatting
    price: typeof r.price === "string" ? Number(r.price) : r.price,
    // normalize listed to boolean if it comes as 0/1
    listed: typeof r.listed === "number" ? r.listed === 1 : !!r.listed,
    // parse JSON fields
    imageUrls: r.imageUrls ? JSON.parse(r.imageUrls) : null,
    tags: r.tags ? JSON.parse(r.tags) : null,
  }));
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  
  const body = await req.json();
  const { 
    name, description, categoryId, sellerId, listed = true, price, 
    imageUrl, imageUrls, brand, size, conditionType, tags 
  } = body;
  
  if (!name || !price) {
    return NextResponse.json({ error: "name and price are required" }, { status: 400 });
  }
  
  const conn = await getConnection();
  try {
    const [result]: any = await conn.execute(
      `INSERT INTO products (name, description, category_id, seller_id, listed, price, 
                            image_url, image_urls, brand, size, condition_type, tags, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        name, description, categoryId || null, sellerId || null, listed, price,
        imageUrl || null, imageUrls ? JSON.stringify(imageUrls) : null,
        brand || null, size || null, conditionType || "good",
        tags ? JSON.stringify(tags) : null
      ]
    );
    
    const [newProduct]: any = await conn.execute(
      `SELECT id, name, description, category_id AS categoryId, seller_id AS sellerId, 
              listed, price, image_url AS imageUrl, image_urls AS imageUrls, 
              brand, size, condition_type AS conditionType, tags, 
              created_at AS createdAt FROM products WHERE id = ?`,
      [result.insertId]
    );
    
    await conn.end();
    
    const product = newProduct[0];
    return NextResponse.json({
      ...product,
      price: typeof product.price === "string" ? Number(product.price) : product.price,
      listed: typeof product.listed === "number" ? product.listed === 1 : !!product.listed,
      imageUrls: product.imageUrls ? JSON.parse(product.imageUrls) : null,
      tags: product.tags ? JSON.parse(product.tags) : null,
    });
  } catch (error) {
    await conn.end();
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
