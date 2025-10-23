import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSupabaseServer } from "@/lib/supabase";
import { verifyLegacyToken } from "@/lib/jwt";

/**
 * 获取当前登录用户
 */
async function getCurrentUser(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    // 从 Authorization 头读取 token
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    let dbUser: any = null;

    if (token) {
      console.log("🔍 Auth header:", authHeader);
      console.log("🔍 Bearer token:", token?.substring(0, 20) + "...");
      
      const { data, error } = await supabase.auth.getUser(token);
      console.log("🔍 Supabase user:", data?.user?.id);
      console.log("🔍 Supabase error:", error);
      
      if (!error && data?.user) {
        dbUser = await prisma.users.findUnique({ where: { supabase_user_id: data.user.id } });
      }

      // 如果 Supabase JWT 失败，尝试 legacy JWT
      if (!dbUser) {
        const v = verifyLegacyToken(token);
        if (v.valid && v.payload?.uid) {
          dbUser = await prisma.users.findUnique({ where: { id: Number(v.payload.uid) } });
        }
      }
    }

    if (!dbUser) {
      console.log("❌ No valid user token found");
      return null;
    }

    console.log("🔍 DB user found:", dbUser.username);

    return {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      role: dbUser.role === "ADMIN" ? "Admin" : "User",
      status: dbUser.status === "SUSPENDED" ? "suspended" : "active",
      isPremium: Boolean(dbUser.is_premium),
      dob: dbUser.dob ? dbUser.dob.toISOString().slice(0, 10) : null,
      gender: dbUser.gender === "MALE" ? "Male" : dbUser.gender === "FEMALE" ? "Female" : null,
    };
  } catch (error) {
    console.error("❌ Error getting current user:", error);
    return null;
  }
}

/**
 * 获取当前用户的listings
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
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
      where.sold = true;
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
      },
      orderBy,
      take: limit,
      skip: offset,
    });

    const formattedListings = listings.map((listing) => ({
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
