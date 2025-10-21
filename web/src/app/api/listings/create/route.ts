import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
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
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 创建 listing
    const listing = await prisma.listings.create({
      data: {
        name: title, // 使用 name 字段
        description,
        price: parseFloat(price),
        brand,
        size,
        condition_type: condition, // 使用 condition_type 字段
        material: material || null,
        tags: tags ? JSON.stringify(tags) : null,
        category_id: await getCategoryId(category),
        seller_id: sessionUser.id,
        image_urls: images ? JSON.stringify(images) : null,
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
        tags: listing.tags ? JSON.parse(listing.tags) : [],
        category: listing.category?.name,
        images: listing.image_urls ? JSON.parse(listing.image_urls) : [],
        seller: {
          name: listing.seller.username,
          avatar: listing.seller.avatar_url || "",
          rating: listing.seller.average_rating || 0,
          sales: listing.seller.total_reviews || 0,
        },
        createdAt: listing.created_at,
      },
    });

  } catch (error) {
    console.error("Error creating listing:", error);
    return NextResponse.json(
      { error: "Failed to create listing" },
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
