// web/src/app/api/feed/home/route.ts
import { NextResponse, NextRequest } from "next/server";
import { cookies as nextCookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// In-memory cache (clears on server restart)
const cache = new Map<string, { data: { items: any[]; meta: any }; timestamp: number }>();
const CACHE_TTL_MS = 20_000; // 20s
const INT32_MAX = 2_147_483_647;

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function GET(req: NextRequest) {
  // Normalize Next cookies into the object shape expected by older/newer @supabase/ssr APIs
  const cookieStore = await (nextCookies() as any);
  const cookieShim = {
    get(name: string) {
      return cookieStore.get?.(name)?.value as string | undefined;
    },
    set(name: string, value: string, options: CookieOptions) {
      cookieStore.set?.({ name, value, ...options });
    },
    remove(name: string, options: CookieOptions) {
      cookieStore.set?.({ name, value: "", ...options, maxAge: 0 });
    },
  } satisfies {
    get(name: string): string | undefined;
    set(name: string, value: string, options: CookieOptions): void;
    remove(name: string, options: CookieOptions): void;
  };

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: cookieShim as any, // cast for cross-version compatibility
  });

  // --- Query params ---
  const { searchParams } = new URL(req.url);
  const limit = Math.max(1, Number(searchParams.get("limit") ?? 20));
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const tag = (searchParams.get("tag") ?? null) || null;

  // seedId: clamp to int32
  const seedParam = searchParams.get("seedId");
  let seedId: number | null = null;
  if (seedParam && !Number.isNaN(Number(seedParam))) {
    const n = Math.trunc(Number(seedParam));
    seedId = Math.max(0, Math.min(INT32_MAX, n));
  }

  // cache bypass toggles for testing
  const noStore = searchParams.get("noStore") === "1" || Boolean(searchParams.get("cacheBust"));
  const offset = (page - 1) * limit;
  const trendingLimit = Math.min(limit, 20);

  const cacheKey = `seed:${seedId ?? "none"}|tag:${tag ?? "none"}|limit:${limit}|page:${page}`;

  // --- Memory cache (20s) ---
  const cached = !noStore ? cache.get(cacheKey) : undefined;
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    const res = NextResponse.json(
      { items: cached.data.items, meta: cached.data.meta, cached: true },
      { status: 200 }
    );
    res.headers.set(
      "Cache-Control",
      noStore ? "no-store" : "public, s-maxage=20, stale-while-revalidate=10"
    );
    res.headers.set("Vary", "seedId, page, tag");
    if (process.env.NODE_ENV !== "production") {
      console.log("[feed/home]", {
        cache: "hit",
        seedId,
        page,
        tag,
        firstIds: (cached.data.items || []).slice(0, 5).map((x: any) => x.id),
      });
    }
    return res;
  }

  // --- Call RPC with retry on transient errors ---
  let data: any[] | null = null;
  let rpcError: Error | null = null;
  const MAX_ATTEMPTS = 3;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const result = await supabase.rpc("get_home_feed", {
      p_listing_id: null,            // home is not anchored to a listing
      p_limit: limit,
      p_tag: tag,
      p_trending_limit: trendingLimit,
      p_seed: seedId,                // <-- NEW: seed drives tie-breaks
      p_offset: offset,              // <-- NEW: pagination
    });

    if (!result.error && result.data) {
      data = result.data;
      break;
    }

    rpcError = (result.error as any) ?? new Error("Unknown Supabase error");
    const transient = /overloaded|timeout|rate|too\s+many/i.test(
      String((rpcError as any)?.message || "")
    );
    if (!transient) break;

    console.warn(`[feed/home] Retry ${attempt}/${MAX_ATTEMPTS}:`, (rpcError as any).message);
    await sleep(500 * attempt);
  }

  if (!data) {
    console.error("[feed/home] RPC failed:", rpcError);
    return NextResponse.json(
      {
        items: [],
        meta: { buckets: { trending: 0, brand: 0, tag: 0 }, page, limit, seedId, cached: false },
        error: "Feed temporarily unavailable. Please try again shortly.",
      },
      { status: 503 }
    );
  }

  // --- Build meta (bucket counts) ---
  const buckets = {
    trending: data.filter((x: any) => x.source === "trending").length,
    brand: data.filter((x: any) => x.source === "brand").length,
    tag: data.filter((x: any) => x.source === "tag").length,
  };

  const payload = {
    items: data,
    meta: { buckets, page, limit, seedId, cached: false },
  };

  // --- Memory cache set ---
  if (!noStore) {
    cache.set(cacheKey, { data: payload, timestamp: Date.now() });
  }

  const res = NextResponse.json(payload, { status: 200 });
  res.headers.set(
    "Cache-Control",
    noStore ? "no-store" : "public, s-maxage=20, stale-while-revalidate=10"
  );
  res.headers.set("Vary", "seedId, page, tag");

  if (process.env.NODE_ENV !== "production") {
    console.log("[feed/home]", {
      cache: "miss",
      seedId,
      page,
      tag,
      buckets,
      firstIds: data.slice(0, 5).map((x: any) => x.id),
    });
  }

  return res;
}
