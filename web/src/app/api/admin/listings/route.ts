import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const conn = await getConnection();
  const [rows]: any = await conn.execute(
    `SELECT l.id, l.name, l.description, l.category_id AS categoryId, l.seller_id AS sellerId,
            l.listed, l.sold, l.price, l.image_url AS imageUrl, l.image_urls AS imageUrls,
            l.brand, l.size, l.condition_type AS conditionType, l.tags,
            l.created_at AS createdAt, u.username AS sellerName,
            t.id AS txId, t.status AS txStatus
     FROM listings l
     LEFT JOIN users u ON l.seller_id = u.id
     LEFT JOIN transactions t ON t.listing_id = l.id
     ORDER BY l.id`
  );
  await conn.end();
  const listings = (rows || []).map((r: any) => ({
    ...r,
    // mysql2 returns DECIMAL as string by default; ensure number for UI formatting
    price: typeof r.price === "string" ? Number(r.price) : r.price,
    // normalize booleans if they come as 0/1
    listed: typeof r.listed === "number" ? r.listed === 1 : !!r.listed,
    sold: typeof r.sold === "number" ? r.sold === 1 : !!r.sold,
    // parse JSON fields
    imageUrls: r.imageUrls ? JSON.parse(r.imageUrls) : null,
    tags: r.tags ? JSON.parse(r.tags) : null,
    txStatus: r.txStatus || null,
    txId: r.txId || null,
  }));
  return NextResponse.json({ listings });
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
      `INSERT INTO listings (name, description, category_id, seller_id, listed, price, 
                            image_url, image_urls, brand, size, condition_type, tags, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        name, description, categoryId || null, sellerId || null, listed, price,
        imageUrl || null, imageUrls ? JSON.stringify(imageUrls) : null,
        brand || null, size || null, conditionType || "good",
        tags ? JSON.stringify(tags) : null
      ]
    );
    
    const [newListing]: any = await conn.execute(
      `SELECT id, name, description, category_id AS categoryId, seller_id AS sellerId, 
              listed, price, image_url AS imageUrl, image_urls AS imageUrls, 
              brand, size, condition_type AS conditionType, tags, 
              created_at AS createdAt FROM listings WHERE id = ?`,
      [result.insertId]
    );
    
    await conn.end();
    
    const listing = newListing[0];
    return NextResponse.json({
      ...listing,
      price: typeof listing.price === "string" ? Number(listing.price) : listing.price,
      listed: typeof listing.listed === "number" ? listing.listed === 1 : !!listing.listed,
      imageUrls: listing.imageUrls ? JSON.parse(listing.imageUrls) : null,
      tags: listing.tags ? JSON.parse(listing.tags) : null,
    });
  } catch (error) {
    await conn.end();
    console.error("Error creating listing:", error);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
