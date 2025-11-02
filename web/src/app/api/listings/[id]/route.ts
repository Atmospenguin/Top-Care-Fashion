import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

/**
 * 映射条件显示值
 */
const mapConditionToDisplay = (conditionEnum: string) => {
  const conditionMap: Record<string, string> = {
    "NEW": "Brand New",
    "LIKE_NEW": "Like new",
    "GOOD": "Good",
    "FAIR": "Fair",
    "POOR": "Poor"
  };
  return conditionMap[conditionEnum] || conditionEnum;
};

/**
 * 映射尺码显示值
 */
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

const mapGenderToEnum = (raw: unknown): "Men" | "Women" | "Unisex" | null => {
  if (typeof raw !== "string") {
    return null;
  }

  const normalized = raw.trim().toLowerCase();
  switch (normalized) {
    case "men":
    case "male":
      return "Men";
    case "women":
    case "female":
      return "Women";
    case "unisex":
    case "uni":
    case "all":
      return "Unisex";
    default:
      return null;
  }
};

/**
 * 获取单个listing详情
 */
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const listingId = Number.parseInt(params.id, 10);

    if (isNaN(listingId)) {
      return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 });
    }

    console.log(`📖 Fetching listing ${listingId}`);

    const listing = await prisma.listings.findUnique({
      where: { id: listingId },
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
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

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
          console.warn("Failed to parse JSON array field for listing", { value: trimmed, error });
          return [];
        }
      }
      return [];
    };

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

    const formattedListing = {
      id: listing.id.toString(),
      title: listing.name,
      description: listing.description,
      price: Number(listing.price),
      brand: listing.brand,
      size: mapSizeToDisplay(listing.size),
      condition: mapConditionToDisplay(listing.condition_type),
      material: listing.material,
      gender: (listing as any).gender || "unisex",
      tags,
      category: listing.category?.name,
      images,
      shippingOption: (listing as any).shipping_option || "Free shipping",
      shippingFee: Number((listing as any).shipping_fee || 0),
      location: (listing as any).location || "",
      seller: {
        id: listing.seller?.id || 0, // 🔥 添加seller ID字段
        name: listing.seller?.username || "Unknown",
        avatar: listing.seller?.avatar_url || "",
        rating: Number(listing.seller?.average_rating) || 0,
        sales: Number(listing.seller?.total_reviews) || 0,
        isPremium: Boolean(listing.seller?.is_premium),
        is_premium: Boolean(listing.seller?.is_premium),
      },
      createdAt: listing.created_at.toISOString(),
      listed: listing.listed,
      sold: listing.sold,
    };

    return NextResponse.json({ listing: formattedListing });
  } catch (error) {
    console.error(`❌ Error fetching listing ${context.params}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch listing", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * 更新listing
 */
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // 使用 getSessionUser 支持 Legacy JWT token
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      console.log("❌ No session user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ Authenticated user:", sessionUser.username, "ID:", sessionUser.id);

    const params = await context.params;
    const listingId = Number.parseInt(params.id, 10);

    if (isNaN(listingId)) {
      return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 });
    }

    const body = await req.json();
    console.log("📝 Updating listing:", listingId, "with data:", JSON.stringify(body, null, 2));

    // 验证listing是否属于当前用户
    const existingListing = await prisma.listings.findFirst({
      where: {
        id: listingId,
        seller_id: sessionUser.id,
      },
    });

    if (!existingListing) {
      return NextResponse.json({ error: "Listing not found or not owned by user" }, { status: 404 });
    }

    // 转换condition字符串到ConditionType枚举
    const mapConditionToEnum = (conditionStr: string) => {
      // 标准化输入字符串，处理大小写和空格
      const normalizedStr = conditionStr.trim();
      
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
      
      const result = conditionMap[normalizedStr];
      console.log("📝 Condition mapping (update):", { input: conditionStr, normalized: normalizedStr, result });
      return result || "GOOD";
    };

    // 准备更新数据
    const updateData: any = {};

    if (body.title !== undefined) updateData.name = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) {
      const numericPrice = Number(body.price);
      if (!Number.isNaN(numericPrice)) {
        updateData.price = numericPrice;
      }
    }
    if (body.brand !== undefined) updateData.brand = body.brand;
    if (body.size !== undefined) updateData.size = body.size;
    if (body.condition !== undefined) updateData.condition_type = mapConditionToEnum(body.condition);
    if (body.material !== undefined) updateData.material = body.material;
    if (body.gender !== undefined) {
      const resolvedGender = mapGenderToEnum(body.gender);
      if (resolvedGender) {
        updateData.gender = resolvedGender;
      }
    }
    if (body.tags !== undefined) updateData.tags = JSON.stringify(body.tags);
    if (body.images !== undefined) updateData.image_urls = JSON.stringify(body.images);
    if (body.shippingOption !== undefined) updateData.shipping_option = body.shippingOption;
    if (body.shippingFee !== undefined) {
      const numericFee = Number(body.shippingFee);
      if (!Number.isNaN(numericFee)) {
        updateData.shipping_fee = numericFee;
      } else {
        updateData.shipping_fee = null;
      }
    }
    if (body.location !== undefined) updateData.location = body.location;
    if (body.listed !== undefined) updateData.listed = body.listed;
    if (body.sold !== undefined) updateData.sold = body.sold;

    // 🔥 处理 category（通过 name 查找 category_id）
    if (body.category !== undefined && typeof body.category === "string" && body.category.trim().length > 0) {
      try {
        const categoryId = await getCategoryId(body.category);
        updateData.category_id = categoryId;
        console.log("✅ Category resolved:", body.category, "->", categoryId);
      } catch (err) {
        console.warn("⚠️ Unable to resolve category:", body.category, err);
      }
    }

    updateData.updated_at = new Date();

    console.log("📝 Update data prepared:", JSON.stringify(updateData, null, 2));

    const updatedListing = await prisma.listings.update({
      where: { id: listingId },
      data: updateData,
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

    console.log("✅ Listing updated successfully:", updatedListing.id);

    const formattedListing = {
      id: updatedListing.id.toString(),
      title: updatedListing.name,
      description: updatedListing.description,
      price: Number(updatedListing.price),
      brand: updatedListing.brand,
      size: mapSizeToDisplay(updatedListing.size),
      condition: mapConditionToDisplay(updatedListing.condition_type),
      material: updatedListing.material,
      gender: (updatedListing as any).gender || "unisex",
      tags: updatedListing.tags ? JSON.parse(updatedListing.tags as string) : [],
      category: updatedListing.category?.name || "Unknown",
      images: updatedListing.image_urls ? JSON.parse(updatedListing.image_urls as string) : 
              (updatedListing.image_url ? [updatedListing.image_url] : []),
      shippingOption: (updatedListing as any).shipping_option || "Free shipping",
      shippingFee: Number((updatedListing as any).shipping_fee || 0),
      location: (updatedListing as any).location || "",
      seller: {
        id: updatedListing.seller?.id || 0, // 🔥 添加seller ID字段
        name: updatedListing.seller?.username || "Unknown",
        avatar: updatedListing.seller?.avatar_url || "",
        rating: Number(updatedListing.seller?.average_rating) || 0,
        sales: updatedListing.seller?.total_reviews || 0,
      },
      listed: updatedListing.listed,
      sold: updatedListing.sold,
      createdAt: updatedListing.created_at.toISOString(),
      updatedAt: updatedListing.updated_at?.toISOString() || null,
    };

    return NextResponse.json({
      success: true,
      listing: formattedListing,
    });

  } catch (error) {
    console.error("❌ Error updating listing:", error);
    return NextResponse.json(
      { error: "Failed to update listing" },
      { status: 500 }
    );
  }
}

/**
 * 删除listing
 */
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // 使用 getSessionUser 支持 Legacy JWT token
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      console.log("❌ No session user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ Authenticated user:", sessionUser.username, "ID:", sessionUser.id);

    const params = await context.params;
    const listingId = Number.parseInt(params.id, 10);

    if (isNaN(listingId)) {
      return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 });
    }

    console.log("🗑️ Deleting listing:", listingId, "for user:", sessionUser.id);

    // 验证listing是否属于当前用户
    const existingListing = await prisma.listings.findFirst({
      where: {
        id: listingId,
        seller_id: sessionUser.id,
      },
    });

    if (!existingListing) {
      return NextResponse.json({ error: "Listing not found or not owned by user" }, { status: 404 });
    }

    // 删除listing
    await prisma.listings.delete({
      where: { id: listingId },
    });

    console.log("✅ Listing deleted successfully:", listingId);

    return NextResponse.json({
      success: true,
      message: "Listing deleted successfully",
    });

  } catch (error) {
    console.error("❌ Error deleting listing:", error);
    return NextResponse.json(
      { error: "Failed to delete listing" },
      { status: 500 }
    );
  }
}

/**
 * 🔥 获取 category ID（通过 category name）
 */
const CATEGORY_CANONICALS = [
  "Accessories",
  "Activewear",
  "Bottoms",
  "Designer",
  "Dresses",
  "Formal Wear",
  "Outerwear",
  "Shoes",
  "Tops",
  "Vintage",
] as const;

async function getCategoryId(categoryName: string): Promise<number> {
  const normalized = (categoryName || "").trim().toLowerCase();

  if (
    !normalized ||
    normalized === "select" ||
    normalized === "none" ||
    normalized.startsWith("select ") ||
    normalized.includes("selecta") ||
    normalized.startsWith("choose")
  ) {
    throw new Error("Category name is empty");
  }

  const synonymMap: Record<string, (typeof CATEGORY_CANONICALS)[number]> = {
    accessories: "Accessories",
    accessory: "Accessories",
    jewelry: "Accessories",
    jewellery: "Accessories",
    bag: "Accessories",
    bags: "Accessories",
    handbag: "Accessories",
    belt: "Accessories",
    belts: "Accessories",
    scarf: "Accessories",
    scarves: "Accessories",
    hat: "Accessories",
    hats: "Accessories",
    beanie: "Accessories",
    sunglasses: "Accessories",
    eyewear: "Accessories",
    watch: "Accessories",
    watches: "Accessories",
    activewear: "Activewear",
    sportswear: "Activewear",
    sport: "Activewear",
    gym: "Activewear",
    workout: "Activewear",
    athleisure: "Activewear",
    bottoms: "Bottoms",
    bottom: "Bottoms",
    pants: "Bottoms",
    trouser: "Bottoms",
    trousers: "Bottoms",
    jeans: "Bottoms",
    shorts: "Bottoms",
    skirt: "Bottoms",
    skirts: "Bottoms",
    leggings: "Bottoms",
    joggers: "Bottoms",
    designer: "Designer",
    luxury: "Designer",
    couture: "Designer",
    dresses: "Dresses",
    dress: "Dresses",
    gown: "Dresses",
    gowns: "Dresses",
    formal: "Formal Wear",
    "formal wear": "Formal Wear",
    suit: "Formal Wear",
    suits: "Formal Wear",
    tuxedo: "Formal Wear",
    tuxedos: "Formal Wear",
    blazer: "Formal Wear",
    blazers: "Formal Wear",
    evening: "Formal Wear",
    outerwear: "Outerwear",
    coat: "Outerwear",
    coats: "Outerwear",
    jacket: "Outerwear",
    jackets: "Outerwear",
    parka: "Outerwear",
    trench: "Outerwear",
    shoes: "Shoes",
    shoe: "Shoes",
    footwear: "Shoes",
    sneaker: "Shoes",
    sneakers: "Shoes",
    heel: "Shoes",
    heels: "Shoes",
    boot: "Shoes",
    boots: "Shoes",
    sandal: "Shoes",
    sandals: "Shoes",
    tops: "Tops",
    top: "Tops",
    shirt: "Tops",
    shirts: "Tops",
    blouse: "Tops",
    blouses: "Tops",
    tee: "Tops",
    tees: "Tops",
    tshirt: "Tops",
    "t-shirt": "Tops",
    hoodie: "Tops",
    hoodies: "Tops",
    sweater: "Tops",
    sweaters: "Tops",
    cardigan: "Tops",
    cardigans: "Tops",
    vintage: "Vintage",
    retro: "Vintage",
    "retro wear": "Vintage",
  };

  const mapped =
    synonymMap[normalized] ??
    CATEGORY_CANONICALS.find((cat) => cat.toLowerCase() === normalized) ??
    "Tops";

  const category = await prisma.listing_categories.findFirst({
    where: { name: mapped },
  });

  if (!category) {
    throw new Error(`Category '${mapped}' is missing from the database.`);
  }

  return category.id;
}