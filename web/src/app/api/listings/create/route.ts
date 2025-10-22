import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    console.log("📝 ===== LISTING CREATE REQUEST RECEIVED =====");
    console.log("📝 Request URL:", req.url);
    console.log("📝 Request method:", req.method);
    console.log("📝 Request headers:", Object.fromEntries(req.headers.entries()));
    
    console.log("📝 Creating listing...");
    console.log("📝 Authorization header:", req.headers.get('authorization'));
    
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      console.log("❌ No session user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    console.log("✅ Authenticated user:", sessionUser.username);

    const body = await req.json();
    console.log("📝 Request body received:", JSON.stringify(body, null, 2));
    const {
      title,
      description,
      price,
      brand,
      size,
      condition,
      material,
      tags,
      category,
      images,
      shippingOption,
      shippingFee,
      location,
    } = body;

    // 验证必需字段
    if (!title || !description || !price || !brand || !size || !condition || !category) {
      console.log("❌ Missing required fields:", { title: !!title, description: !!description, price: !!price, brand: !!brand, size: !!size, condition: !!condition, category: !!category });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 转换condition字符串到ConditionType枚举
    const mapConditionToEnum = (conditionStr: string) => {
      const conditionMap: Record<string, "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "POOR"> = {
        "Brand New": "NEW",
        "Like New": "LIKE_NEW", 
        "Good": "GOOD",
        "Fair": "FAIR",
        "Poor": "POOR"
      };
      return conditionMap[conditionStr] || "GOOD";
    };

    console.log("📝 Creating listing with mapped data:", {
      name: title,
      condition_type: mapConditionToEnum(condition),
      category_id: await getCategoryId(category),
      seller_id: sessionUser.id
    });

    // 创建 listing
    const listing = await prisma.listings.create({
      data: {
        name: title, // 使用 name 字段
        description,
        price: parseFloat(price),
        brand,
        size,
        condition_type: mapConditionToEnum(condition), // 转换为枚举值
        material: material || null,
        tags: tags ? JSON.stringify(tags) : Prisma.JsonNull,
        category_id: await getCategoryId(category),
        seller_id: sessionUser.id,
        image_urls: images ? JSON.stringify(images) : Prisma.JsonNull,
        listed: true,
        sold: false,
      },
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
    });

    return NextResponse.json({
      success: true,
      data: {
        id: listing.id.toString(),
        title: listing.name, // 返回 name 作为 title
        description: listing.description,
        price: listing.price,
        brand: listing.brand,
        size: listing.size,
        condition: listing.condition_type,
        material: listing.material,
        tags: listing.tags ? JSON.parse(listing.tags as string) : [],
        category: listing.category?.name,
        images: listing.image_urls ? JSON.parse(listing.image_urls as string) : [],
        seller: {
          name: listing.seller?.username || "Unknown",
          avatar: listing.seller?.avatar_url || "",
          rating: listing.seller?.average_rating || 0,
          sales: listing.seller?.total_reviews || 0,
        },
        createdAt: listing.created_at,
      },
    });

  } catch (error) {
    console.error("❌ Error creating listing:", error);
    console.error("📦 Error detail:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: "Failed to create listing", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// 辅助函数：根据分类名称获取分类ID
async function getCategoryId(categoryName: string): Promise<number> {
  // 首先尝试直接匹配
  let category = await prisma.listing_categories.findFirst({
    where: { name: categoryName },
  });

  if (category) {
    return category.id;
  }

  // 如果没找到，尝试匹配子分类（如 "men-tops-t-shirts"）
  const subcategory = await prisma.listing_categories.findFirst({
    where: { name: { contains: categoryName.toLowerCase() } },
  });

  if (subcategory) {
    return subcategory.id;
  }

  // 如果还是没找到，创建一个默认分类
  const defaultCategory = await prisma.listing_categories.create({
    data: {
      name: categoryName.toLowerCase(),
      description: `Category for ${categoryName}`,
    },
  });

  return defaultCategory.id;
}
