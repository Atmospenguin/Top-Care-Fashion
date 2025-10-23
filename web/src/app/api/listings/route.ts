import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // 构建查询条件
    const where: any = {
      listed: true,
      sold: false,
    };

    if (category) {
      where.category = {
        name: { contains: category.toLowerCase() },
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
        { tags: { contains: search, mode: "insensitive" } },
      ];
    }

  // 获取 listings
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
        } catch (parseError) {
          console.warn("Failed to parse JSON string field", parseError);
          return [];
        }
      }
      if (typeof value === "object") {
        const entries = Object.values(value as Record<string, unknown>);
        return entries.every((item) => typeof item === "string")
          ? (entries as string[])
          : [];
      }
      return [];
    };

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

    const mapSizeToDisplay = (sizeValue: string | null) => {
      if (!sizeValue) return "N/A";
      
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
        "Other": "Other", "N/A": "N/A"
      };
      
      return sizeMap[sizeValue] || sizeValue;
    };

    const toNumber = (value: unknown): number => {
      if (value == null) return 0;
      if (typeof value === "number") return value;
      if (typeof value === "bigint") return Number(value);
      if (typeof value === "string") return Number(value) || 0;
      if (typeof value === "object") {
        const maybeDecimal = value as { toNumber?: () => number; toString?: () => string };
        if (typeof maybeDecimal.toNumber === "function") {
          const result = maybeDecimal.toNumber();
          return Number.isFinite(result) ? result : 0;
        }
        if (typeof maybeDecimal.toString === "function") {
          const str = maybeDecimal.toString();
          const parsed = Number(str);
          return Number.isFinite(parsed) ? parsed : 0;
        }
      }
      return 0;
    };

    // 转换数据格式
    const formattedListings = listings.map((listing) => {
      const sellerInfo = listing.seller
        ? {
            name: listing.seller.username,
            avatar: listing.seller.avatar_url ?? "",
            rating: toNumber(listing.seller.average_rating),
            sales: listing.seller.total_reviews ?? 0,
          }
        : { name: "", avatar: "", rating: 0, sales: 0 };

      return {
        id: listing.id.toString(),
        title: listing.name, // 使用 name 字段
        description: listing.description,
  price: toNumber(listing.price),
        brand: listing.brand,
        size: mapSizeToDisplay(listing.size),
        condition: mapConditionToDisplay(listing.condition_type), // 使用映射函数转换枚举值
        material: listing.material,
        tags: toArray(listing.tags),
        category: listing.category?.name ?? null,
        images: toArray(listing.image_urls),
        seller: sellerInfo,
        createdAt: listing.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        items: formattedListings,
        total: formattedListings.length,
        hasMore: formattedListings.length === limit,
      },
    });

  } catch (error) {
    console.error("Error fetching listings:", error);
    return NextResponse.json(
      { error: "Failed to fetch listings" },
      { status: 500 }
    );
  }
}