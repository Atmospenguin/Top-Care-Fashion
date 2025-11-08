import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

/**
 * POST /api/listings/[id]/click
 * 记录listing点击并更新clicks_count和listing_clicks表
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const listingId = Number.parseInt(params.id, 10);

    if (isNaN(listingId)) {
      return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 });
    }

    // 检查listing是否存在
    const listing = await prisma.listings.findUnique({
      where: { id: listingId },
      select: {
        id: true,
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // 获取用户（可选，未登录用户也可以点击）
    const user = await getSessionUser(req);
    const userId = user?.id ?? null;

    // 记录点击到listing_clicks表
    await prisma.listing_clicks.create({
      data: {
        listing_id: listingId,
        user_id: userId,
        clicked_at: new Date(),
      },
    });

    // 使用原子操作更新clicks_count
    await prisma.listings.update({
      where: { id: listingId },
      data: {
        clicks_count: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Click recorded",
    });
  } catch (error) {
    console.error("Error recording click:", error);
    return NextResponse.json(
      { error: "Failed to record click" },
      { status: 500 }
    );
  }
}

