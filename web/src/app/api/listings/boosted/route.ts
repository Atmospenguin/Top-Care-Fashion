import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const STALE_PROMOTION_WINDOW_DAYS = 30;

type BoostedListingRow = {
  id: number;
  listing_id: number;
  status: string;
  started_at: Date;
  ends_at: Date | null;
  views: number | null;
  clicks: number | null;
  view_uplift_percent: number | null;
  click_uplift_percent: number | null;
  used_free_credit: boolean | null;
  listing_title: string | null;
  listing_price: unknown;
  listing_size: string | null;
  listing_image_urls: unknown;
  listing_image_url: string | null;
};

const MAX_RESULTS = 50;

function parsePrice(value: unknown): number {
  if (value == null) {
    return 0;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  return 0;
}

function coerceArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.length > 0);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string" && item.length > 0);
      }
    } catch {
      if (value.startsWith("http")) {
        return [value];
      }
    }
  }

  return [];
}

function buildImageList(raw: unknown, fallback: string | null): string[] {
  const urls = coerceArray(raw);
  if (urls.length > 0) {
    return urls;
  }
  if (fallback) {
    return [fallback];
  }
  return [];
}

function toIso(value: Date | null): string | null {
  if (!value) {
    return null;
  }
  try {
    return value.toISOString();
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const staleCutoff = new Date();
    staleCutoff.setDate(staleCutoff.getDate() - STALE_PROMOTION_WINDOW_DAYS);

    const rows = await prisma.$queryRaw<BoostedListingRow[]>`
      SELECT
        lp.id,
        lp.listing_id,
        lp.status,
        lp.started_at,
        lp.ends_at,
        lp.views,
        lp.clicks,
        lp.view_uplift_percent,
        lp.click_uplift_percent,
        lp.used_free_credit,
        l.name AS listing_title,
        l.price AS listing_price,
        l.size AS listing_size,
        l.image_urls AS listing_image_urls,
        l.image_url AS listing_image_url
      FROM listing_promotions lp
      INNER JOIN listings l ON l.id = lp.listing_id
      WHERE lp.seller_id = ${sessionUser.id}
        AND (
          lp.status IN ('ACTIVE', 'SCHEDULED')
          OR (
            lp.status = 'EXPIRED'
            AND (lp.ends_at IS NULL OR lp.ends_at >= ${staleCutoff})
          )
        )
      ORDER BY lp.started_at DESC
      LIMIT ${MAX_RESULTS};
    `;

    const data = rows
      .filter((row) => row.listing_title)
      .map((row) => {
        const images = buildImageList(row.listing_image_urls, row.listing_image_url);
        const primaryImage = images[0] ?? null;

        return {
          id: row.id,
          listingId: row.listing_id,
          title: row.listing_title ?? "",
          size: row.listing_size,
          price: parsePrice(row.listing_price),
          images,
          primaryImage,
          status: row.status,
          startedAt: toIso(row.started_at),
          endsAt: toIso(row.ends_at),
          views: row.views ?? 0,
          clicks: row.clicks ?? 0,
          viewUpliftPercent: row.view_uplift_percent ?? 0,
          clickUpliftPercent: row.click_uplift_percent ?? 0,
          usedFreeCredit: row.used_free_credit ?? false,
        };
      });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("❌ Failed to load boosted listings:", error);
    return NextResponse.json({ error: "Failed to load boosted listings" }, { status: 500 });
  }
}
