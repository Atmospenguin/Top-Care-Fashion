import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * 映射尺码显示值
 */
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
 * 获取用户的 listings
 */
export async function GET(req: NextRequest, context: { params: Promise<{ username: string }> }) {
  try {
    const params = await context.params;
    const username = params.username;
    const { searchParams } = new URL(req.url);
    
    const status = searchParams.get('status') || 'active'; // active, sold, all
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log(`📖 Fetching listings for user: ${username}, status: ${status}`);

    // 首先找到用户
    const user = await prisma.users.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 构建查询条件
    const whereCondition: any = {
      seller_id: user.id,
    };

    if (status === 'active') {
      whereCondition.listed = true;
      whereCondition.sold = false;
    } else if (status === 'sold') {
      whereCondition.sold = true;
    }
    // 如果 status === 'all'，不添加额外条件

    const listings = await prisma.listings.findMany({
      where: whereCondition,
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
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    });

    const formattedListings = listings.map((listing) => ({
      id: listing.id.toString(),
      title: listing.name,
      description: listing.description,
      price: Number(listing.price),
      brand: listing.brand,
      size: mapSizeToDisplay(listing.size),
      condition: mapConditionToDisplay(listing.condition_type),
      material: listing.material,
      gender: (listing as any).gender || "unisex",
      tags: listing.tags ? JSON.parse(listing.tags as string) : [],
      category: listing.category?.name,
      images: listing.image_urls ? JSON.parse(listing.image_urls as string) : [],
      seller: {
        name: listing.seller?.username || "Unknown",
        avatar: listing.seller?.avatar_url || "",
        rating: Number(listing.seller?.average_rating) || 0,
        sales: Number(listing.seller?.total_reviews) || 0,
      },
      createdAt: listing.created_at.toISOString(),
      listed: listing.listed,
      sold: listing.sold,
    }));

    return NextResponse.json({
      success: true,
      listings: formattedListings,
      total: formattedListings.length,
    });

  } catch (error) {
    console.error(`❌ Error fetching user listings:`, error);
    return NextResponse.json(
      { error: "Failed to fetch user listings" },
      { status: 500 }
    );
  }
}








