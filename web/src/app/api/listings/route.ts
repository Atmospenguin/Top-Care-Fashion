import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";

export async function GET() {
  try {
    console.log("Connecting to DB...");
    const connection = await getConnection();
    console.log("Connected!");

    // Query products table for public marketplace
    const [rows] = await connection.execute(
      `SELECT id, name AS title, description, category_id AS categoryId, 
              price, image_url AS imageUrl, image_urls AS imageUrls,
              brand, size, condition_type AS conditionType, tags,
              created_at AS createdAt
       FROM products 
       WHERE listed = 1 
       ORDER BY created_at DESC`
    );

    await connection.end();

    // Convert and normalize data
    const items = (rows as any[]).map(row => ({
      ...row,
      price: Number(row.price),
      imageUrls: row.imageUrls ? JSON.parse(row.imageUrls) : null,
      tags: row.tags ? JSON.parse(row.tags) : null,
    }));

    console.log("Items returned:", items);

    return NextResponse.json({ items });
  } catch (err: any) {
    console.error("DB Error:", err);
    return NextResponse.json(
      { error: "Database error", details: err.message },
      { status: 500 }
    );
  }
}
