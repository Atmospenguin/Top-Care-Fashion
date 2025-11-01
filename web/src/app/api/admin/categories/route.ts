import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function mapCategory(category: {
  id: number;
  name: string;
  description: string | null;
  created_at: Date;
}) {
  return {
    id: String(category.id),
    name: category.name,
    description: category.description,
    createdAt: category.created_at.toISOString(),
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
    },
    select: {
      id: true,
      name: true,
      description: true,
      created_at: true,
    },
  });

  return NextResponse.json(mapCategory(category), { status: 201 });
}
