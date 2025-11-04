import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PromotionStatus } from "@prisma/client";

// Create new promotion
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { listingId, sellerId, endsAt, usedFreeCredit } = body;

    if (!listingId || !sellerId) {
      return NextResponse.json(
        { error: "listingId and sellerId are required" },
        { status: 400 }
      );
    }

    // Check if listing exists and is not sold
    const listing = await prisma.listings.findUnique({
      where: { id: Number(listingId) },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.sold) {
      return NextResponse.json(
        { error: "Cannot promote a sold listing" },
        { status: 400 }
      );
    }

    // Check if there's already an active promotion
    const existingPromotion = await prisma.listing_promotions.findFirst({
      where: {
        listing_id: Number(listingId),
        status: PromotionStatus.ACTIVE,
      },
    });

    if (existingPromotion) {
      return NextResponse.json(
        { error: "Listing already has an active promotion" },
        { status: 400 }
      );
    }

    // Create the promotion
    const promotion = await prisma.listing_promotions.create({
      data: {
        listing_id: Number(listingId),
        seller_id: Number(sellerId),
        status: PromotionStatus.ACTIVE,
        started_at: new Date(),
        ends_at: endsAt ? new Date(endsAt) : null,
        used_free_credit: usedFreeCredit ?? false,
      },
    });

    return NextResponse.json({
      success: true,
      promotion: {
        id: promotion.id,
        listingId: promotion.listing_id,
        sellerId: promotion.seller_id,
        status: promotion.status,
        startedAt: promotion.started_at.toISOString(),
        endsAt: promotion.ends_at ? promotion.ends_at.toISOString() : null,
        views: promotion.views,
        clicks: promotion.clicks,
        usedFreeCredit: promotion.used_free_credit,
      },
    });
  } catch (error) {
    console.error("Error creating promotion:", error);
    return NextResponse.json(
      { error: "Failed to create promotion" },
      { status: 500 }
    );
  }
}
