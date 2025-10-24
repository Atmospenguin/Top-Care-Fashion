import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const categories = await prisma.listing_categories.findMany({
      orderBy: { name: "asc" },
      select: { name: true },
    });

    const toRecord = () =>
      categories.reduce<Record<string, string[]>>((acc, category) => {
        acc[category.name] = [];
        return acc;
      }, {});

    return NextResponse.json({
      success: true,
      data: {
        men: toRecord(),
        women: toRecord(),
        unisex: toRecord(),
      },
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
