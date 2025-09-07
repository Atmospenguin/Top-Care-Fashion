import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";

export async function GET() {
  try {
    console.log("Connecting to DB...");
    const connection = await getConnection();
    console.log("Connected!");

    // Query: join listings with items + categories
    const [rows] = await connection.execute(
      `SELECT l.id,
              i.name AS title,
              c.name AS category,
              l.listing_price AS price
       FROM listings l
       JOIN items i ON l.item_id = i.id
       JOIN categories c ON i.category_id = c.id`
    );

    await connection.end();

    // Convert price from string → number
    const items = (rows as any[]).map(row => ({
      ...row,
      price: Number(row.price),
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
