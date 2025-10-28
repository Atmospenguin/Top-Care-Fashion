import { NextRequest, NextResponse } from "next/server";
import { prisma, parseJson } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ConditionType, Prisma, TxStatus } from "@prisma/client";
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

function normalizeConditionIn(value: unknown): ConditionType {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === "NEW") return ConditionType.NEW;
  if (normalized === "LIKE_NEW") return ConditionType.LIKE_NEW;
  if (normalized === "GOOD") return ConditionType.GOOD;
  if (normalized === "FAIR") return ConditionType.FAIR;
  if (normalized === "POOR") return ConditionType.POOR;
  return ConditionType.GOOD;
}

function mapTxStatus(value: TxStatus | null | undefined):
  | "pending"
  | "paid"
  | "shipped"
  | "completed"
  | "cancelled"
  | null {
  if (!value) return null;
  return value.toString().toLowerCase() as any;
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  const listing = await prisma.listings.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      category_id: true,
      seller_id: true,
      listed: true,
      sold: true,
      price: true,
      image_url: true,
      image_urls: true,
      brand: true,
      size: true,
      condition_type: true,
      tags: true,
      created_at: true,
      sold_at: true,
    },
  });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const seller = listing.seller_id
    ? await prisma.users.findUnique({ where: { id: listing.seller_id }, select: { username: true } })
    : null;
  const tx = await prisma.transactions.findFirst({
    where: { listing_id: id },
    orderBy: { created_at: "desc" },
    select: { id: true, status: true },
  });

  return NextResponse.json({
    id: String(listing.id),
    name: listing.name,
    description: listing.description,
    categoryId: listing.category_id ? String(listing.category_id) : null,
    sellerId: listing.seller_id ? String(listing.seller_id) : null,
    listed: Boolean(listing.listed),
    sold: Boolean(listing.sold),
    price: toNumber(listing.price) ?? 0,
    imageUrl: listing.image_url ?? null,
    imageUrls: (listing.image_urls as unknown) ?? null,
    brand: listing.brand ?? null,
    size: listing.size ?? null,
    conditionType: mapConditionOut(listing.condition_type),
    tags: parseJson<string[]>(listing.tags) ?? [],
    createdAt: listing.created_at.toISOString(),
    soldAt: listing.sold_at ? listing.sold_at.toISOString() : null,
    sellerName: seller?.username ?? null,
    txId: tx ? String(tx.id) : null,
    txStatus: mapTxStatus(tx?.status),
  });
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  const body = await req.json().catch(() => ({}));
  const {
    name,
    description,
    categoryId,
    sellerId,
    listed,
    price,
    imageUrl,
    imageUrls,
    brand,
    size,
    conditionType,
    tags,
  } = body ?? {};

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name ?? null;
  if (description !== undefined) data.description = description ?? null;
  if (categoryId !== undefined) data.category_id = categoryId ? Number(categoryId) : null;
  if (sellerId !== undefined) data.seller_id = sellerId ? Number(sellerId) : null;
  if (listed !== undefined) data.listed = Boolean(listed);
  if (price !== undefined) data.price = Number(price);
  if (imageUrl !== undefined) data.image_url = imageUrl ?? null;
  if (imageUrls !== undefined) data.image_urls = imageUrls ?? null;
  if (brand !== undefined) data.brand = brand ?? null;
  if (size !== undefined) data.size = size ?? null;
  if (conditionType !== undefined) data.condition_type = normalizeConditionIn(conditionType);
  if (tags !== undefined) {
    if (Array.isArray(tags)) {
      data.tags = tags.length ? JSON.stringify(tags) : null;
    } else if (typeof tags === "string") {
      const trimmed = tags.trim();
      if (!trimmed) {
        data.tags = null;
      } else if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
        data.tags = trimmed;
      } else {
        const pieces = trimmed
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        data.tags = pieces.length ? JSON.stringify(pieces) : null;
      }
    } else {
      data.tags = tags ?? null;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  try {
    await prisma.listings.update({ where: { id }, data });
    const listing = await prisma.listings.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        category_id: true,
        seller_id: true,
        listed: true,
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
    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      id: String(listing.id),
      name: listing.name,
      description: listing.description,
      categoryId: listing.category_id ? String(listing.category_id) : null,
      sellerId: listing.seller_id ? String(listing.seller_id) : null,
      price: toNumber(listing.price) ?? 0,
      listed: Boolean(listing.listed),
      imageUrl: listing.image_url ?? null,
      imageUrls: (listing.image_urls as unknown) ?? null,
      brand: listing.brand ?? null,
      size: listing.size ?? null,
      conditionType: mapConditionOut(listing.condition_type),
      tags: parseJson<string[]>(listing.tags) ?? [],
      createdAt: listing.created_at.toISOString(),
    });
  } catch (error) {
    console.error("Error updating listing:", error);
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  try {
    await prisma.listings.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    // Foreign key (has transactions): fallback to unlist
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      try {
        await prisma.listings.update({ where: { id }, data: { listed: false } });
        return NextResponse.json({ ok: true, softDeleted: true });
      } catch {
        return NextResponse.json({ error: "Failed to unlist listing" }, { status: 500 });
      }
    }
    return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 });
  }
}
