import { NextResponse } from "next/server";
import { getConnection, parseJson, toNumber } from "@/lib/db";

type TagList = string[];

type ImageList = string[];

function mapCondition(value: unknown): string | null {
  const normalized = String(value ?? "").toLowerCase();
  return normalized || null;
}

export async function GET() {
  try {
    const connection = await getConnection();

    const [rows]: any = await connection.execute(
      `SELECT id, name AS title, description, category_id AS "categoryId",
              price, image_url AS "imageUrl", image_urls AS "imageUrls",
              brand, size, condition_type AS "conditionType", tags,
              created_at AS "createdAt"
       FROM listings
       WHERE listed = TRUE
       ORDER BY created_at DESC`
    );

    await connection.end();

    const items = (rows as any[]).map((row) => ({
      ...row,
      price: toNumber(row.price) ?? 0,
      imageUrls: parseJson<ImageList>(row.imageUrls),
      tags: parseJson<TagList>(row.tags),
      conditionType: mapCondition(row.conditionType),
    }));

    return NextResponse.json({ items });
  } catch (err: any) {
    console.error("DB Error:", err);
    return NextResponse.json(
      { error: "Database error", details: err.message },
      { status: 500 }
    );
  }
}
