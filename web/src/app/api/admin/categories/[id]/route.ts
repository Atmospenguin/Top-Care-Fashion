import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const categoryId = Number(params.id);

    const updateData: {
      name?: string;
      description?: string;
    } = {};

    if (body.name !== undefined && body.name !== null) {
      updateData.name = body.name;
    }
    if (body.description !== undefined && body.description !== null) {
      updateData.description = body.description;
    }

    const category = await prisma.listing_categories.update({
      where: { id: categoryId },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        created_at: true,
      },
    });

    return NextResponse.json({
      id: String(category.id),
      name: category.name,
      description: category.description,
      createdAt: category.created_at.toISOString(),
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const categoryId = Number(params.id);

    await prisma.listing_categories.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
