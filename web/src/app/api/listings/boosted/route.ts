import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const STALE_PROMOTION_WINDOW_DAYS = 30;

const PLACEHOLDER_SIZE_TOKENS = new Set([
  "",
  "n",
  "na",
  "notavailable",
  "notapplicable",
  "none",
  "null",
  "undefined",
]);

const normalizeToken = (value: string) => value.replace(/[^a-z0-9]/gi, "").toLowerCase();

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

  if (typeof value === "object" && value !== null) {
    const candidate = value as { toNumber?: () => number; toString?: () => string };
    if (typeof candidate.toNumber === "function") {
      const result = candidate.toNumber();
      return Number.isFinite(result) ? result : 0;
    }
    if (typeof candidate.toString === "function") {
      const parsed = Number(candidate.toString());
      return Number.isFinite(parsed) ? parsed : 0;
    }
  }

  return 0;
}

function parseSizePayload(raw: string): string | null {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const candidate = parsed.find((item) => typeof item === "string" && item.trim().length > 0);
      return candidate ? candidate.trim() : null;
    }
    if (parsed && typeof parsed === "object") {
      const fields = ["size", "label", "value", "name"] as const;
      for (const field of fields) {
        const value = (parsed as Record<string, unknown>)[field];
        if (typeof value === "string" && value.trim()) {
          return value.trim();
        }
      }
    }
  } catch (_error) {
    if (raw.startsWith("[")) {
      return null;
    }
    if (raw.startsWith("{")) {
      return null;
    }
  }
  return null;
}

function mapSizeToDisplay(value: unknown): string | null {
  if (value == null) {
    return null;
  }

  const raw = typeof value === "string" ? value : String(value ?? "");
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  let candidate = trimmed;
  if (
    (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
    (trimmed.startsWith("{") && trimmed.endsWith("}"))
  ) {
    const parsed = parseSizePayload(trimmed);
    if (parsed) {
      candidate = parsed;
    }
  }

  const normalized = normalizeToken(candidate);
  if (PLACEHOLDER_SIZE_TOKENS.has(normalized)) {
    return null;
  }

  const sizeValue = candidate.trim();

  if (sizeValue.includes("/")) {
    const parts = sizeValue.split("/");
    const primary = parts[0]?.trim() ?? sizeValue;
    const alphanumeric = primary.replace(/[^a-z0-9]/gi, "");
    if (alphanumeric.length === 0) {
      return null;
    }

    const standardSizes = [
      "XXS",
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "XXL",
      "XXXL",
    ];
    if (standardSizes.includes(primary.toUpperCase())) {
      return primary.toUpperCase();
    }

    const numberMatch = primary.match(/\d+/);
    if (numberMatch) {
      return numberMatch[0];
    }

    return primary;
  }

  const sizeMap: Record<string, string> = {
    // Numeric shoe sizes
    "28": "28",
    "29": "29",
    "30": "30",
    "31": "31",
    "32": "32",
    "33": "33",
    "34": "34",
    "35": "35",
    "36": "36",
    "37": "37",
    "38": "38",
    "39": "39",
    "40": "40",
    "41": "41",
    "42": "42",
    "43": "43",
    "44": "44",
    "45": "45",
    "46": "46",
    "47": "47",
    "48": "48",
    "49": "49",
    "50": "50",
    // Apparel sizes
    "XXS": "XXS",
    "XS": "XS",
    "S": "S",
    "M": "M",
    "L": "L",
    "XL": "XL",
    "XXL": "XXL",
    "XXXL": "XXXL",
    // Accessories / general sizes
    "ONE SIZE": "One Size",
    "ONESIZE": "One Size",
    "FREE SIZE": "Free Size",
    "FREESIZE": "Free Size",
    "SMALL": "Small",
    "MEDIUM": "Medium",
    "LARGE": "Large",
    "EXTRA LARGE": "Extra Large",
    "OTHER": "Other",
  };

  const upperValue = sizeValue.toUpperCase();
  if (sizeMap[upperValue]) {
    return sizeMap[upperValue];
  }

  return sizeValue;
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

    const now = new Date();

    await prisma.$executeRaw`
      UPDATE listing_promotions
      SET status = 'EXPIRED', updated_at = ${now}
      WHERE seller_id = ${sessionUser.id}
        AND status = 'ACTIVE'
        AND ends_at IS NOT NULL
        AND ends_at <= ${now};
    `;

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
          size: mapSizeToDisplay(row.listing_size),
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
