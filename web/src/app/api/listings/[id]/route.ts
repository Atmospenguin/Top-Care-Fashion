import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSupabaseServer } from "@/lib/supabase";

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

    let userId: string | null = null;

    if (token) {
      const { data, error } = await supabase.auth.getUser(token);
      
      if (!error && data?.user) {
        userId = data.user.id;
      }
    }

    if (!userId) {
      return null;
    }

    // 查找数据库用户
    const dbUser = await prisma.users.findUnique({
      where: { supabase_user_id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        is_premium: true,
        dob: true,
        gender: true,
      },
    });

    if (!dbUser) {
      return null;
    }

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
 * 获取单个listing详情
 */
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const listingId = parseInt(params.id);

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

    const formattedListing = {
      id: listing.id.toString(),
      title: listing.name,
      description: listing.description,
      price: Number(listing.price),
      brand: listing.brand,
      size: listing.size,
      condition: mapConditionToDisplay(listing.condition_type),
      material: listing.material,
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
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const listingId = parseInt(params.id);

    if (isNaN(listingId)) {
      return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 });
    }

    const body = await req.json();
    console.log("📝 Updating listing:", listingId, "with data:", JSON.stringify(body, null, 2));

    // 验证listing是否属于当前用户
    const existingListing = await prisma.listings.findFirst({
      where: {
        id: listingId,
        seller_id: user.id,
      },
    });

    if (!existingListing) {
      return NextResponse.json({ error: "Listing not found or not owned by user" }, { status: 404 });
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

    // 准备更新数据
    const updateData: any = {};

    if (body.title !== undefined) updateData.name = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = parseFloat(body.price);
    if (body.brand !== undefined) updateData.brand = body.brand;
    if (body.size !== undefined) updateData.size = body.size;
    if (body.condition !== undefined) updateData.condition_type = mapConditionToEnum(body.condition);
    if (body.material !== undefined) updateData.material = body.material;
    if (body.tags !== undefined) updateData.tags = JSON.stringify(body.tags);
    if (body.images !== undefined) updateData.image_urls = JSON.stringify(body.images);
    if (body.listed !== undefined) updateData.listed = body.listed;
    if (body.sold !== undefined) updateData.sold = body.sold;

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
      size: updatedListing.size,
      condition: updatedListing.condition_type.toLowerCase(),
      material: updatedListing.material,
      tags: updatedListing.tags ? JSON.parse(updatedListing.tags as string) : [],
      category: updatedListing.category?.name || "Unknown",
      images: updatedListing.image_urls ? JSON.parse(updatedListing.image_urls as string) : 
              (updatedListing.image_url ? [updatedListing.image_url] : []),
      seller: {
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
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const listingId = parseInt(params.id);

    if (isNaN(listingId)) {
      return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 });
    }

    console.log("🗑️ Deleting listing:", listingId, "for user:", user.id);

    // 验证listing是否属于当前用户
    const existingListing = await prisma.listings.findFirst({
      where: {
        id: listingId,
        seller_id: user.id,
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
