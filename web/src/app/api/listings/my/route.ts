import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

/**
 * 获取当前登录用户
 */
// 统一鉴权：使用 getSessionUser(req)

/**
 * 获取当前用户的listings
 */
export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    const user = sessionUser ? sessionUser : null;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // 'active', 'sold', 'all'
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    
    // Filter参数
    const category = searchParams.get("category");
    const condition = searchParams.get("condition");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sortBy = searchParams.get("sortBy") || "latest";

    console.log("📖 Loading user listings for user:", user.id);
    console.log("📖 Filter params:", { status, category, condition, minPrice, maxPrice, sortBy });

    // 构建查询条件
    const where: any = {
      seller_id: user.id,
    };

    if (status === "active") {
      where.listed = true;
      where.sold = false;
    } else if (status === "sold") {
      // 🔥 修改逻辑：显示所有有订单记录的商品（包括被取消的）
      where.orders = {
        some: {} // 只要有订单记录就显示
      };
    }
    // 如果status是'all'或者没有指定，则获取所有listings

    // 添加filter条件
    if (category && category !== "All") {
      // 直接使用分类名称查询，避免额外的数据库查询
      where.category = {
        name: category,
      };
    }

    if (condition && condition !== "All") {
      // 转换condition到数据库格式
      let conditionType = condition.toUpperCase().replace(" ", "_");
      if (conditionType === "NEW") conditionType = "NEW";
      else if (conditionType === "LIKE_NEW") conditionType = "LIKE_NEW";
      else if (conditionType === "GOOD") conditionType = "GOOD";
      else if (conditionType === "FAIR") conditionType = "FAIR";
      
      where.condition_type = conditionType;
    }

    if (minPrice) {
      where.price = { ...where.price, gte: parseFloat(minPrice) };
    }

    if (maxPrice) {
      where.price = { ...where.price, lte: parseFloat(maxPrice) };
    }

    // 构建排序条件
    let orderBy: any = { created_at: "desc" };
    if (sortBy === "price_low_to_high") {
      orderBy = { price: "asc" };
    } else if (sortBy === "price_high_to_low") {
      orderBy = { price: "desc" };
    } else if (sortBy === "latest") {
      orderBy = { created_at: "desc" };
    }

    console.log("📖 Final where clause:", JSON.stringify(where, null, 2));
    console.log("📖 Order by:", orderBy);

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
        // 🔥 对于sold状态的商品，包含最新的订单信息
        orders: status === "sold" ? {
          select: {
            id: true,
            status: true,
            created_at: true,
            updated_at: true,
          },
          orderBy: { created_at: "desc" },
          take: 1, // 只取最新的订单
        } : false,
      },
      orderBy,
      take: limit,
      skip: offset,
    });

    // 🔥 为每个sold商品获取conversationId
    const listingsWithConversations = await Promise.all(
      listings.map(async (listing) => {
        let conversationId = null;
        if (status === "sold" && listing.orders?.[0]) {
          // 通过 listing_id 和用户 ID 查找对应的 conversation
          const conversation = await prisma.conversations.findFirst({
            where: {
              listing_id: listing.id,
              OR: [
                { initiator_id: user.id },
                { participant_id: user.id }
              ]
            },
            select: {
              id: true
            }
          });
          conversationId = conversation?.id?.toString() || null;
        }
        
        return {
          ...listing,
          conversationId
        };
      })
    );

    const parseJsonArray = (value: unknown): string[] => {
      if (!value) return [];
      if (Array.isArray(value)) {
        return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
      }
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) {
          return [];
        }
        try {
          const parsed = JSON.parse(trimmed);
          return Array.isArray(parsed)
            ? parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
            : [];
        } catch (error) {
          if (/^https?:\/\//i.test(trimmed)) {
            return [trimmed];
          }
          console.warn("Failed to parse JSON array field", { value: trimmed, error });
          return [];
        }
      }
      return [];
    };

    const formattedListings = listingsWithConversations.map((listing) => {
      const images = (() => {
        const parsed = parseJsonArray(listing.image_urls);
        if (parsed.length > 0) {
          return parsed;
        }
        if (typeof listing.image_url === "string" && listing.image_url.trim().length > 0) {
          return [listing.image_url];
        }
        return [];
      })();

      const tags = parseJsonArray(listing.tags);

      return {
        id: listing.id.toString(),
        title: listing.name,
        description: listing.description,
        price: Number(listing.price),
        brand: listing.brand,
        size: listing.size,
        condition: listing.condition_type.toLowerCase(),
        material: listing.material,
        tags,
        category: listing.category?.name || "Unknown",
        images,
        seller: {
          id: listing.seller?.id ?? 0,
          name: listing.seller?.username || "Unknown",
          avatar: listing.seller?.avatar_url || "",
          rating: Number(listing.seller?.average_rating) || 0,
          sales: listing.seller?.total_reviews || 0,
          isPremium: Boolean(listing.seller?.is_premium),
          is_premium: Boolean(listing.seller?.is_premium),
        },
        listed: listing.listed,
        sold: listing.sold,
        createdAt: listing.created_at.toISOString(),
        updatedAt: listing.updated_at?.toISOString() || null,
        // 🔥 添加订单状态信息（仅对sold商品）
        orderStatus: status === "sold" && listing.orders?.[0] ? listing.orders[0].status : null,
        orderId: status === "sold" && listing.orders?.[0] ? listing.orders[0].id : null,
        conversationId: listing.conversationId,
      };
    });

    console.log(`✅ Found ${formattedListings.length} listings for user ${user.id}`);

    return NextResponse.json({
      listings: formattedListings,
      total: formattedListings.length,
    });

  } catch (error) {
    console.error("❌ Error fetching user listings:", error);
    return NextResponse.json(
      { error: "Failed to fetch listings" },
      { status: 500 }
    );
  }
}
