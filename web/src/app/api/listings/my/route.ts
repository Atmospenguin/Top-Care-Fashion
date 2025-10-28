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
            buyer_id: true,
            seller_id: true,
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
          const latestOrder = listing.orders[0];

          // 通过 listing_id 和订单参与双方查找对应 conversation，避免命中其他买家的对话
          const conversation = await prisma.conversations.findFirst({
            where: {
              listing_id: listing.id,
              OR: [
                {
                  initiator_id: latestOrder.buyer_id,
                  participant_id: latestOrder.seller_id,
                },
                {
                  initiator_id: latestOrder.seller_id,
                  participant_id: latestOrder.buyer_id,
                },
              ],
            },
            select: {
              id: true,
            },
          });

          conversationId = conversation?.id?.toString() || null;
        }
        
        return {
          ...listing,
          conversationId
        };
      })
    );

    const formattedListings = listingsWithConversations.map((listing) => ({
      id: listing.id.toString(),
      title: listing.name,
      description: listing.description,
      price: Number(listing.price),
      brand: listing.brand,
      size: listing.size,
      condition: listing.condition_type.toLowerCase(),
      material: listing.material,
      tags: listing.tags ? JSON.parse(listing.tags as string) : [],
      category: listing.category?.name || "Unknown",
      images: listing.image_urls ? JSON.parse(listing.image_urls as string) : 
              (listing.image_url ? [listing.image_url] : []),
      seller: {
        name: listing.seller?.username || "Unknown",
        avatar: listing.seller?.avatar_url || "",
        rating: Number(listing.seller?.average_rating) || 0,
        sales: listing.seller?.total_reviews || 0,
      },
      listed: listing.listed,
      sold: listing.sold,
      createdAt: listing.created_at.toISOString(),
      updatedAt: listing.updated_at?.toISOString() || null,
      // 🔥 添加订单状态信息（仅对sold商品）
      orderStatus: status === "sold" && listing.orders?.[0] ? listing.orders[0].status : null,
      orderId: status === "sold" && listing.orders?.[0] ? listing.orders[0].id : null,
      buyerId: status === "sold" && listing.orders?.[0] ? listing.orders[0].buyer_id : null,
      sellerId: status === "sold" && listing.orders?.[0] ? listing.orders[0].seller_id : null,
      conversationId: listing.conversationId,
    }));

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
