import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  
  const conn = await getConnection();
  
  try {
    // Get user's listings
    const [rows] = await conn.execute(
      `SELECT 
        id, name, description, category_id AS categoryId, seller_id AS sellerId, 
        listed, price, image_url AS imageUrl, image_urls AS imageUrls, 
        brand, size, condition_type AS conditionType, tags, 
        created_at AS createdAt 
      FROM listings 
      WHERE seller_id = ? 
      ORDER BY created_at DESC`,
      [params.id]
    );
    
    const listings = (rows as any[]).map(row => ({
      ...row,
      price: Number(row.price),
      listed: Boolean(row.listed),
      imageUrls: row.imageUrls ? JSON.parse(row.imageUrls) : null,
      tags: row.tags ? JSON.parse(row.tags) : null,
    }));
    
    await conn.end();
    return NextResponse.json({ listings });
    
  } catch (error) {
    await conn.end();
    console.error("Error fetching user listings:", error);
    return NextResponse.json(
      { error: "Failed to fetch user listings" },
      { status: 500 }
    );
  }
}
