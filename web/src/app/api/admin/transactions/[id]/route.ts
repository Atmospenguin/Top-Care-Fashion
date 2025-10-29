import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { adminStatusToOrder, orderStatusToAdmin, summarizeOrderTotals } from "@/lib/admin-orders";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  const order = await prisma.orders.findUnique({
    where: { id },
    include: {
      buyer: { select: { username: true, email: true } },
      seller: { select: { username: true, email: true } },
      listing: {
        select: {
          id: true,
          name: true,
          description: true,
          image_url: true,
          brand: true,
          size: true,
          condition_type: true,
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  const { quantity, priceEach } = summarizeOrderTotals(order);

  const transaction = {
    id: String(order.id),
    buyerId: String(order.buyer_id),
    sellerId: String(order.seller_id),
    listingId: String(order.listing_id),
    quantity,
    priceEach,
    status: orderStatusToAdmin(order.status),
    createdAt: order.created_at.toISOString(),
    buyerName: order.buyer?.username ?? null,
    buyerEmail: order.buyer?.email ?? null,
    sellerName: order.seller?.username ?? null,
    sellerEmail: order.seller?.email ?? null,
    listingName: order.listing?.name ?? null,
    listingDescription: order.listing?.description ?? null,
    listingImageUrl: order.listing?.image_url ?? null,
    listingBrand: order.listing?.brand ?? null,
    listingSize: order.listing?.size ?? null,
    listingCondition: order.listing?.condition_type
      ? order.listing.condition_type.toLowerCase()
      : null,
  };

  return NextResponse.json(transaction);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { status } = (await req.json().catch(() => ({}))) as { status?: string };

  if (!status) {
    return NextResponse.json({ error: "Status is required" }, { status: 400 });
  }

  const normalizedStatus = adminStatusToOrder(status);
  const id = Number(params.id);

  try {
    const updatedOrder = await prisma.orders.update({
      where: { id },
      data: {
        status: normalizedStatus,
        updated_at: new Date(),
      },
      include: {
        listing: { select: { id: true, sold_at: true } },
      },
    });

    const statusLower = String(status).trim().toLowerCase();
    if (statusLower === "completed" && updatedOrder.listing) {
      const soldAt = updatedOrder.listing.sold_at ?? new Date();
      await prisma.listings.update({
        where: { id: updatedOrder.listing.id },
        data: {
          sold: true,
          listed: false,
          sold_at: soldAt,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    console.error("Error updating transaction:", error);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}
