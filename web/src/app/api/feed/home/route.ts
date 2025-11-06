// web/src/app/api/feed/home/route.ts
import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 🧠 Simple memory cache (resets when server restarts)
const cache = new Map<
  string,
  { data: { items: any[]; meta: any }; timestamp: number }
>();
const CACHE_TTL_MS = 60_000; // 1 minute cache

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
  });

  // 🔍 Parse query params
  const { searchParams } = new URL(req.url);
  const limit = Math.max(0, Number(searchParams.get("limit") ?? 20));
  const seedId = searchParams.get("seedId")
    ? Number(searchParams.get("seedId"))
    : null;
  const tag = searchParams.get("tag") ?? null;
  const trendingLimit = Math.min(limit, 20);
  const cacheKey = `${seedId || "none"}-${tag || "none"}-${limit}`;

  // ✅ Serve cached data if recent (< 1 min)
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      items: cached.data.items,
      meta: cached.data.meta,
      cached: true,
    });
  }

  // 🔁 Retry logic for transient Supabase errors
  let data: any[] | null = null;
  let rpcError: Error | null = null;
  const MAX_ATTEMPTS = 3;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const result = await supabase.rpc("get_home_feed", {
      p_listing_id: seedId,
      p_limit: limit,
      p_tag: tag,
      p_trending_limit: trendingLimit,
    });

    if (!result.error && result.data) {
      data = result.data;
      break;
    }

    rpcError = result.error ?? new Error("Unknown Supabase error");

    const transient =
      typeof rpcError.message === "string" &&
      /overloaded|timeout/i.test(rpcError.message);

    if (!transient) break;

    console.warn(
      `[feed/home] Retry ${attempt}/${MAX_ATTEMPTS} after transient error:`,
      rpcError.message
    );

    await sleep(500 * attempt); // exponential backoff
  }

  // ❌ If failed after retries
  if (!data) {
    console.error("[feed/home] RPC failed:", rpcError);
    return NextResponse.json(
      {
        items: [],
        meta: { buckets: { trending: 0, brand: 0, tag: 0 } },
        error: "Feed temporarily unavailable. Please try again shortly.",
      },
      { status: 503 }
    );
  }

  // 📊 Build meta buckets
  const buckets = {
    trending: data.filter((x: any) => x.source === "trending").length,
    brand: data.filter((x: any) => x.source === "brand").length,
    tag: data.filter((x: any) => x.source === "tag").length,
  };

  const payload = { items: data, meta: { buckets } };

  // 🗃️ Cache result
  cache.set(cacheKey, { data: payload, timestamp: Date.now() });

  return NextResponse.json(payload);
}
