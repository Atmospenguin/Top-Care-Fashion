import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ConditionType } from "@prisma/client";
import { toNumber } from "@/lib/db";

function mapConditionOut(value: ConditionType | null | undefined):
  | "new"
  | "like_new"
  | "good"
  | "fair"
  | "poor"
  | null {
  switch (value) {
    case ConditionType.NEW:
      return "new";
    case ConditionType.LIKE_NEW:
      return "like_new";
    case ConditionType.GOOD:
      return "good";
    case ConditionType.FAIR:
      return "fair";
    case ConditionType.POOR:
      return "poor";
    default:
      return null;
  }
}

export async function GET() {
  try {
    const rows = await prisma.listings.findMany({
      where: { listed: true },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        category_id: true,
        price: true,
        image_url: true,
        image_urls: true,
        brand: true,
        size: true,
        condition_type: true,
        tags: true,
        created_at: true,
      },
    });

    const items = rows.map((row) => ({
      id: row.id,
      title: row.name,
      description: row.description,
      categoryId: row.category_id ?? null,
      price: toNumber(row.price) ?? 0,
      imageUrl: row.image_url ?? null,
      imageUrls: (row.image_urls as unknown) ?? null,
      brand: row.brand ?? null,
      size: row.size ?? null,
      conditionType: mapConditionOut(row.condition_type),
      tags: (row.tags as unknown) ?? null,
      createdAt: row.created_at.toISOString(),
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
