import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { orderStatusToAdmin, summarizeOrderTotals } from "@/lib/admin-orders";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const orders = await prisma.orders.findMany({
    include: {
      buyer: { select: { id: true, username: true, email: true } },
      seller: { select: { id: true, username: true, email: true } },
      listing: {
        select: {
          id: true,
          name: true,
          description: true,
          image_url: true,
          brand: true,
          size: true,
          condition_type: true,
          price: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  const transactions = orders.map((order) => {
    const { quantity, priceEach } = summarizeOrderTotals(order);
    return {
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
  });

  return NextResponse.json({ transactions });
}
