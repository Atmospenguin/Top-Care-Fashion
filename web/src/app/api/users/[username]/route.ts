import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * 根据用户名获取用户信息
 */
export async function GET(req: NextRequest, context: { params: Promise<{ username: string }> }) {
  try {
    const params = await context.params;
    const username = params.username;

    console.log(`📖 Fetching user profile for username: ${username}`);

    const user = await prisma.users.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        location: true,
        dob: true,
        gender: true,
        avatar_url: true,
        average_rating: true,
        total_reviews: true,
        created_at: true,
        // 统计信息
        listings_as_seller: {
          select: {
            id: true,
            listed: true,
            sold: true,
          },
        },
        // Follow统计
        followers: {
          select: {
            id: true,
          },
        },
        following: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 计算统计信息
    const totalListings = user.listings_as_seller.length;
    const activeListings = user.listings_as_seller.filter(l => l.listed && !l.sold).length;
    const soldListings = user.listings_as_seller.filter(l => l.sold).length;
    
    // 计算follow统计
    const followersCount = user.followers.length;
    const followingCount = user.following.length;

    // 检查当前用户是否关注了这个用户（如果有认证信息）
    let isFollowing = false;
    try {
      const authHeader = req.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
      
      if (token) {
        // 这里可以添加获取当前用户的逻辑来检查follow状态
        // 暂时设为false，后续可以在前端处理
      }
    } catch (error) {
      // 忽略认证错误，继续返回用户信息
    }

    const formattedUser = {
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      bio: user.bio,
      location: user.location,
      dob: user.dob ? user.dob.toISOString().slice(0, 10) : null,
      gender: user.gender === "MALE" ? "Male" : user.gender === "FEMALE" ? "Female" : null,
      avatar_url: user.avatar_url,
      rating: Number(user.average_rating) || 0,
      reviewsCount: Number(user.total_reviews) || 0,
      totalListings,
      activeListings,
      soldListings,
      followersCount,
      followingCount,
      memberSince: user.created_at.toISOString().slice(0, 10),
      isFollowing,
    };

    return NextResponse.json({
      success: true,
      user: formattedUser,
    });

  } catch (error) {
    console.error(`❌ Error fetching user profile:`, error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}
