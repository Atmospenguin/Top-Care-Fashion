// web/src/app/api/search/route.ts
// Search API with feed algorithm integration
import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies as nextCookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || "";

type SearchRow = {
  id: number;
  title: string | null;
  image_url: string | null;
  price_cents: number | null;
  brand: string | null;
  tags: string[] | null;
  source: string;
  fair_score: number | null;
  final_score: number | null;
  is_boosted?: boolean;
  boost_weight?: number;
  search_relevance: number | null;
};

// Helper function to extract image URLs
function extractImageUrls(imageUrls: unknown, imageUrl: string | null): string[] {
  if (imageUrls) {
    if (Array.isArray(imageUrls)) {
      const urls = imageUrls.filter((item): item is string => typeof item === "string" && item.length > 0);
      if (urls.length > 0) return urls;
    } else if (typeof imageUrls === "string") {
      try {
        const parsed = JSON.parse(imageUrls);
        if (Array.isArray(parsed)) {
          const urls = parsed.filter((item): item is string => typeof item === "string" && item.length > 0);
          if (urls.length > 0) return urls;
        }
      } catch {
        if (imageUrls.startsWith("http")) {
          return [imageUrls];
        }
      }
    }
  }
  
  if (imageUrl && typeof imageUrl === "string" && imageUrl.trim().length > 0) {
    return [imageUrl];
  }
  
  return [];
}

// Extract Supabase user ID from request
async function getSupabaseUserIdFromRequest(req: NextRequest): Promise<string | null> {
  // 1) Try mobile Bearer token
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (token) {
    const tmp = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await tmp.auth.getUser(token);
    if (!error && data?.user?.id) return data.user.id;
  }

  // 2) Fallback: SSR cookie session (Next.js web)
  try {
    const cookieStore = await (nextCookies() as any);
    const ssr = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    });
    const { data: { user } } = await ssr.auth.getUser();
    if (user?.id) return user.id;
  } catch (err) {
    console.warn("Failed to get user from cookies:", err);
  }

  return null;
}

function parseIntSafe(v: string | null, d: number) {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : d;
}

function parseSeed(v: string | null, d: number) {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) ? n : d;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchQuery = url.searchParams.get("q") || url.searchParams.get("search") || "";
    const category = url.searchParams.get("category");
    const categoryId = url.searchParams.get("categoryId");
    const gender = url.searchParams.get("gender");
    const limit = parseIntSafe(url.searchParams.get("limit"), 20);
    const page = parseIntSafe(url.searchParams.get("page"), 1);
    const offset = (page - 1) * limit;
    const seedId = parseSeed(url.searchParams.get("seed"), Date.now());
    
    // 检测请求来源：移动端默认启用feed算法，web端需要显式启用
    const userAgent = req.headers.get("user-agent") || "";
    const isMobileApp = userAgent.includes("ReactNative") || 
                       userAgent.includes("Mobile") ||
                       req.headers.get("x-mobile-app") === "true";
    
    // useFeed参数：移动端默认启用，web端需要显式启用（不影响生产环境）
    const useFeedParam = url.searchParams.get("useFeed");
    const useFeed = useFeedParam !== null 
      ? useFeedParam === "true" 
      : isMobileApp; // 移动端默认启用，web端默认禁用

    // Validate search query
    if (!searchQuery || searchQuery.trim().length === 0) {
      return NextResponse.json(
        { error: "Search query is required", success: false },
        { status: 400 }
      );
    }

    // Get user ID for personalized search
    const supabaseUserId = await getSupabaseUserIdFromRequest(req);

    // If useFeed is true, use the feed algorithm (only if user is authenticated)
    if (useFeed) {
      const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE || SUPABASE_ANON_KEY);

      // Parse categoryId if provided
      const parsedCategoryId = categoryId ? parseInt(categoryId, 10) : null;
      if (categoryId && isNaN(parsedCategoryId as any)) {
        return NextResponse.json(
          { error: "Invalid categoryId", success: false },
          { status: 400 }
        );
      }

      const { data, error } = await admin.rpc("get_search_feed", {
        p_supabase_user_id: supabaseUserId || null, // Allow null for anonymous users
        p_search_query: searchQuery.trim(),
        p_limit: limit,
        p_offset: offset,
        p_seed: seedId,
        p_gender: gender || null,
        p_category_id: parsedCategoryId, // Use categoryId instead of category name
      });

      if (error) {
        console.error("Search feed error:", error);
        // Fallback to regular search if feed search fails (silent fallback)
        // This ensures production environment is not affected
        console.warn("Falling back to regular search due to feed search error");
        return await fallbackSearch(searchQuery, category, gender, limit, offset);
      }

      if (!data || data.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            items: [],
            total: 0,
            hasMore: false,
            page,
            limit,
            searchQuery,
            useFeed: true,
          },
        });
      }

      // Transform data to match API format
      const items = data.map((row: SearchRow) => {
        // Get image URLs from tags (which might contain image_urls) or image_url
        // Note: get_search_feed returns image_url directly, but we need to handle image_urls if present
        const imageUrls = extractImageUrls(null, row.image_url);

        return {
          id: row.id.toString(),
          title: row.title || "",
          description: null, // Search feed doesn't return description
          price: row.price_cents ? Number(row.price_cents) / 100 : 0,
          brand: row.brand || "",
          size: null,
          condition: null,
          material: null,
          tags: Array.isArray(row.tags) ? row.tags : (row.tags ? JSON.parse(row.tags as any) : []),
          category: null,
          images: imageUrls.length > 0 ? imageUrls : [],
          shippingOption: null,
          shippingFee: 0,
          location: null,
          likesCount: 0,
          availableQuantity: 1,
          gender: gender || "Unisex",
          seller: {
            id: 0,
            name: "",
            avatar: "",
            rating: 0,
            sales: 0,
            isPremium: false,
            is_premium: false,
          },
          createdAt: null,
          updatedAt: null,
          // Feed algorithm metadata
          source: row.source,
          fair_score: row.fair_score ? Number(row.fair_score) : null,
          final_score: row.final_score ? Number(row.final_score) : null,
          is_boosted: row.is_boosted || false,
          boost_weight: row.boost_weight ? Number(row.boost_weight) : null,
          search_relevance: row.search_relevance ? Number(row.search_relevance) : null,
        };
      });

      return NextResponse.json({
        success: true,
        data: {
          items,
          total: items.length, // Note: get_search_feed doesn't return total count
          hasMore: items.length >= limit,
          page,
          limit,
          searchQuery,
          useFeed: true,
        },
      });
    } else {
      // Fallback to regular search
      return await fallbackSearch(searchQuery, category, gender, limit, offset);
    }
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Failed to perform search", success: false },
      { status: 500 }
    );
  }
}

// Fallback to regular Prisma search (existing production search logic)
// This is the default behavior and remains unchanged for backward compatibility
async function fallbackSearch(
  searchQuery: string,
  category: string | null,
  gender: string | null,
  limit: number,
  offset: number
) {
  const { prisma } = await import("@/lib/db");
  const { Prisma } = await import("@prisma/client");

  const where: any = {
    listed: true,
    sold: false,
  };

  if (category) {
    where.category = {
      name: { contains: category, mode: "insensitive" },
    };
  }

  if (gender) {
    const normalizeGender = (value: string): "Men" | "Women" | "Unisex" | undefined => {
      const lower = value.toLowerCase();
      if (lower === "men" || lower === "male") return "Men";
      if (lower === "women" || lower === "female") return "Women";
      if (lower === "unisex" || lower === "all") return "Unisex";
      return undefined;
    };

    const normalizedGender = normalizeGender(gender);
    if (normalizedGender) {
      where.gender = normalizedGender;
    }
  }

  if (searchQuery) {
    const trimmed = searchQuery.trim();
    if (trimmed.length > 0) {
      const searchFilters: any[] = [
        { name: { contains: trimmed, mode: "insensitive" } },
        { description: { contains: trimmed, mode: "insensitive" } },
        { brand: { contains: trimmed, mode: "insensitive" } },
      ];
      where.OR = searchFilters;
    }
  }

  const totalCount = await prisma.listings.count({ where });

  const listings = await prisma.listings.findMany({
    where,
    include: {
      seller: {
        select: {
          id: true,
          username: true,
          avatar_url: true,
          average_rating: true,
          total_reviews: true,
          is_premium: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
    take: limit,
    skip: offset,
  });

  const toArray = (value: unknown): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value as string[];
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    if (typeof value === "object") {
      const entries = Object.values(value as Record<string, unknown>);
      return entries.every((item) => typeof item === "string") ? (entries as string[]) : [];
    }
    return [];
  };

  const toNumber = (value: unknown): number => {
    if (value == null) return 0;
    if (typeof value === "number") return value;
    if (typeof value === "bigint") return Number(value);
    if (typeof value === "string") return Number(value) || 0;
    return 0;
  };

  const formattedListings = listings.map((listing) => {
    const sellerInfo = listing.seller
      ? {
          id: listing.seller.id,
          name: listing.seller.username,
          avatar: listing.seller.avatar_url ?? "",
          rating: toNumber(listing.seller.average_rating),
          sales: listing.seller.total_reviews ?? 0,
          isPremium: Boolean(listing.seller.is_premium),
          is_premium: Boolean(listing.seller.is_premium),
        }
      : { id: 0, name: "", avatar: "", rating: 0, sales: 0, isPremium: false, is_premium: false };

    const imageUrls = toArray(listing.image_urls);
    const images = imageUrls.length > 0
      ? imageUrls
      : (listing.image_url && typeof listing.image_url === 'string' && listing.image_url.trim() !== ''
          ? [listing.image_url]
          : []);

    return {
      id: listing.id.toString(),
      title: listing.name,
      description: listing.description,
      price: toNumber(listing.price),
      brand: listing.brand,
      size: listing.size,
      condition: listing.condition_type,
      material: listing.material,
      tags: toArray(listing.tags),
      category: listing.category?.name ?? null,
      images,
      shippingOption: (listing as any).shipping_option ?? null,
      shippingFee: toNumber((listing as any).shipping_fee ?? null),
      location: (listing as any).location ?? null,
      likesCount: toNumber((listing as any).likes_count ?? 0),
      availableQuantity: toNumber((listing as any).inventory_count ?? 1),
      gender: (() => {
        const value = (listing as any).gender;
        if (!value || typeof value !== "string") return "Unisex";
        const lower = value.toLowerCase();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      })(),
      seller: sellerInfo,
      createdAt: listing.created_at ? listing.created_at.toISOString() : null,
      updatedAt: listing.updated_at ? listing.updated_at.toISOString() : null,
    };
  });

  return NextResponse.json({
    success: true,
    data: {
      items: formattedListings,
      total: totalCount,
      hasMore: offset + formattedListings.length < totalCount,
      page: Math.floor(offset / limit) + 1,
      limit,
      searchQuery,
      useFeed: false,
    },
  });
}

