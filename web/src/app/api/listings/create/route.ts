import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { isPremiumUser, getListingLimit } from "@/lib/userPermissions";

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

    // 🔥 检查用户的 listing 数量限制
    const user = await prisma.users.findUnique({
      where: { id: sessionUser.id },
      select: {
        is_premium: true,
        premium_until: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isPremium = isPremiumUser(user);
    const listingLimit = getListingLimit(isPremium);

    // 如果有限制，检查当前活跃 listing 数量
    if (listingLimit !== null) {
      const activeListingsCount = await prisma.listings.count({
        where: {
          seller_id: sessionUser.id,
          listed: true,
          sold: false,
        },
      });

      console.log("📊 Listing limit check:", {
        isPremium,
        activeListingsCount,
        listingLimit,
      });

      if (activeListingsCount >= listingLimit) {
        return NextResponse.json(
          {
            error: "Listing limit reached",
            message: `Free users can only have ${listingLimit} active listings. Upgrade to Premium for unlimited listings.`,
            limit: listingLimit,
            current: activeListingsCount,
          },
          { status: 403 }
        );
      }
    }

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
      gender,
      images,
      shippingOption,
      shippingFee,
      location,
    } = body;

    // 验证必需字段（只验证核心字段）
    if (!title || !description || !price || !category || !shippingOption) {
      console.log("❌ Missing required fields:", { 
        title: !!title, 
        description: !!description, 
        price: !!price, 
        category: !!category,
        shippingOption: !!shippingOption
      });
      return NextResponse.json(
        { error: "Missing required fields: title, description, price, category, shippingOption" },
        { status: 400 }
      );
    }

    // 转换condition字符串到ConditionType枚举
    const mapConditionToEnum = (conditionStr: string | undefined) => {
      if (!conditionStr) return "GOOD"; // 默认值
      
      // 🔥 标准化输入字符串
      const conditionMap: Record<string, "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "POOR"> = {
        "Brand New": "NEW",
        "New": "NEW",
        "Like New": "LIKE_NEW", 
        "Like new": "LIKE_NEW",
        "like new": "LIKE_NEW",
        "Good": "GOOD",
        "good": "GOOD",
        "Fair": "FAIR",
        "fair": "FAIR",
        "Poor": "POOR",
        "poor": "POOR"
      };
      
      const normalizedStr = String(conditionStr).trim();
      const result = conditionMap[normalizedStr];
      console.log("📝 Condition mapping:", { input: conditionStr, normalized: normalizedStr, result });
      return result || "GOOD";
    };

    console.log("📝 Creating listing with mapped data:", {
      name: title,
      condition_type: mapConditionToEnum(condition),
      category_id: await getCategoryId(category),
      seller_id: sessionUser.id
    });

    const categoryId = await getCategoryId(category);

    // 创建 listing
    const listing = await prisma.listings.create({
      data: {
        name: title,
        description,
        price: parseFloat(price),
        brand: brand || "",
        size: size ?? null,
        condition_type: mapConditionToEnum(condition),
        material: material || null,
        tags: tags ? JSON.stringify(tags) : Prisma.JsonNull,
        category_id: categoryId,
        gender: gender ? gender.toLowerCase() : "unisex",
        seller_id: sessionUser.id,
        image_urls: images ? JSON.stringify(images) : Prisma.JsonNull,
        listed: true,
        sold: false,
        shipping_option: shippingOption || null,
        shipping_fee: shippingFee != null ? parseFloat(String(shippingFee)) : null,
        location: location || null,
      } as any,
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

    const mapSizeToDisplay = (sizeValue: string | null): string | null => {
      if (!sizeValue) return null;
      
      // 处理复杂的尺码字符串（如 "M / EU 38 / UK 10 / US 6"）
      if (sizeValue.includes("/")) {
        const parts = sizeValue.split("/");
        const firstPart = parts[0].trim();
        
        // 如果第一部分是字母尺码，直接返回
        if (["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"].includes(firstPart)) {
          return firstPart;
        }
        
        // 如果包含数字，提取数字部分
        const numberMatch = firstPart.match(/\d+/);
        if (numberMatch) {
          return numberMatch[0];
        }
        
        return firstPart;
      }
      
      // 处理简单的尺码值
      const sizeMap: Record<string, string> = {
        // 数字尺码（鞋子）
        "28": "28", "29": "29", "30": "30", "31": "31", "32": "32", "33": "33", "34": "34",
        "35": "35", "36": "36", "37": "37", "38": "38", "39": "39", "40": "40", "41": "41", "42": "42", "43": "43", "44": "44", "45": "45",
        "46": "46", "47": "47", "48": "48", "49": "49", "50": "50",
        
        // 服装尺码
        "XXS": "XXS", "XS": "XS", "S": "S", "M": "M", "L": "L", "XL": "XL", "XXL": "XXL", "XXXL": "XXXL",
        "Free Size": "Free Size",
        
        // 配饰尺码
        "One Size": "One Size", "Small": "Small", "Medium": "Medium", "Large": "Large",
        
        // 包类尺码
        "Extra Large": "Extra Large",
        
        // 通用选项
        "Other": "Other"
      };

      return sizeMap[sizeValue] || sizeValue;
    };

    return NextResponse.json({
      success: true,
      data: {
        id: listing.id.toString(),
        title: listing.name,
        description: listing.description,
        price: listing.price,
        brand: listing.brand,
        size: mapSizeToDisplay(listing.size),
        condition: listing.condition_type,
        material: listing.material,
        tags: listing.tags ? JSON.parse(listing.tags as string) : [],
        category: listing.category?.name,
        images: listing.image_urls ? JSON.parse(listing.image_urls as string) : [],
        shippingOption: (listing as any).shipping_option ?? null,
        shippingFee: (listing as any).shipping_fee ?? null,
        location: (listing as any).location ?? null,
        likesCount: (listing as any).likes_count ?? 0,
        gender: (() => {
          const value = (listing as any).gender;
          if (!value || typeof value !== "string") return "Unisex";
          const lower = value.toLowerCase();
          return lower.charAt(0).toUpperCase() + lower.slice(1);
        })(),
        seller: {
          name: listing.seller?.username || "Unknown",
          avatar: listing.seller?.avatar_url || "",
          rating: listing.seller?.average_rating || 0,
          sales: listing.seller?.total_reviews || 0,
        },
        createdAt: listing.created_at ? listing.created_at.toISOString() : null,
        updatedAt: listing.updated_at ? listing.updated_at.toISOString() : null,
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
const BASE_CATEGORY_NAMES = ["Accessories", "Bottoms", "Footwear", "Outerwear", "Tops"] as const;

async function getCategoryId(categoryName: string): Promise<number> {
  const name = (categoryName || "").trim().toLowerCase();

  const synonymMap: Record<string, typeof BASE_CATEGORY_NAMES[number]> = {
    accessories: "Accessories",
    accessory: "Accessories",
    bags: "Accessories",
    belts: "Accessories",
    bottoms: "Bottoms",
    pants: "Bottoms",
    trousers: "Bottoms",
    shorts: "Bottoms",
    skirts: "Bottoms",
    leggings: "Bottoms",
    joggers: "Bottoms",
    footwear: "Footwear",
    shoes: "Footwear",
    shoe: "Footwear",
    boots: "Footwear",
    sneakers: "Footwear",
    outerwear: "Outerwear",
    coats: "Outerwear",
    jackets: "Outerwear",
    blazers: "Outerwear",
    tops: "Tops",
    top: "Tops",
    shirts: "Tops",
    shirt: "Tops",
    hoodies: "Tops",
    sweaters: "Tops",
    dress: "Tops",
    dresses: "Tops",
    activewear: "Tops",
    others: "Accessories",
    other: "Accessories",
  };

  const mappedName = synonymMap[name] ?? BASE_CATEGORY_NAMES.find((cat) => cat.toLowerCase() === name) ?? "Tops";

  const category = await prisma.listing_categories.findFirst({
    where: { name: mappedName },
  });

  if (!category) {
    throw new Error(`Base category '${mappedName}' is missing from the database.`);
  }

  return category.id;
}
