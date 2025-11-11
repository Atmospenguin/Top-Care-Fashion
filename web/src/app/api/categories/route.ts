import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const categories = await prisma.listing_categories.findMany({
      where: { is_active: true },
      orderBy: [{ sort_order: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    });

    // Create a map of category name to ID for easy lookup
    const categoryMap = categories.reduce<Record<string, number>>((acc, cat) => {
      acc[cat.name] = cat.id;
      return acc;
    }, {});
    
    // Create records with category name as key, value contains id and subcategories
    // For backward compatibility, keep the same structure but add id
    const toRecord = () =>
      categories.reduce<Record<string, { id: number; subcategories: string[] }>>((acc, category) => {
        acc[category.name] = { id: category.id, subcategories: [] };
        return acc;
      }, {});

    return NextResponse.json({
      success: true,
      data: {
        men: toRecord(),
        women: toRecord(),
        unisex: toRecord(),
        categoryMap, // 名称到ID的映射
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
