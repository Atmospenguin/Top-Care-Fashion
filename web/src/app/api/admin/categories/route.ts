import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function mapCategory(category: {
  id: number;
  name: string;
  description: string | null;
  created_at: Date;
  is_active: boolean | null;
  ai_keywords: any;
  ai_weight_boost: number | null;
  _count?: {
    listings: number;
  };
}) {
  return {
    id: String(category.id),
    name: category.name,
    description: category.description,
    createdAt: category.created_at.toISOString(),
    isActive: category.is_active ?? true,
    aiKeywords: category.ai_keywords || [],
    aiWeightBoost: category.ai_weight_boost ?? 1.0,
    listingCount: category._count?.listings ?? 0,
  };
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const categories = await prisma.listing_categories.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      created_at: true,
      is_active: true,
      ai_keywords: true,
      ai_weight_boost: true,
      _count: {
        select: {
          listings: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  return NextResponse.json({ categories: categories.map(mapCategory) });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();

  const category = await prisma.listing_categories.create({
    data: {
      name: body.name,
      description: body.description ?? null,
      is_active: body.isActive ?? true,
      ai_keywords: body.aiKeywords ?? [],
      ai_weight_boost: body.aiWeightBoost ?? 1.0,
    },
    select: {
      id: true,
      name: true,
      description: true,
      created_at: true,
      is_active: true,
      ai_keywords: true,
      ai_weight_boost: true,
      _count: {
        select: {
          listings: true,
        },
      },
    },
  });

  return NextResponse.json(mapCategory(category), { status: 201 });
}
