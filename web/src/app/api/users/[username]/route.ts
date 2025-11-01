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

    type UserProfileQueryResult = {
      id: number;
      username: string;
      email: string;
      bio: string | null;
      location: string | null;
      dob: Date | null;
      gender: string | null;
      avatar_url: string | null;
      average_rating: any;
      total_reviews: number | null;
      created_at: Date;
      is_premium: boolean;
      premium_until: Date | null;
      last_sign_in_at: Date | null;
      listings_as_seller: Array<{ id: number; listed: boolean; sold: boolean }>;
      followers: Array<{ id: number }>;
      following: Array<{ id: number }>;
    };

    const user = (await prisma.users.findUnique({
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
        is_premium: true,
        premium_until: true,
        last_sign_in_at: true,
        listings_as_seller: {
          select: {
            id: true,
            listed: true,
            sold: true,
          },
        },
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
      } as any,
    })) as UserProfileQueryResult | null;

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

    const isFollowing = false;

    const formattedUser = {
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      bio: user.bio,
      location: user.location,
      dob: user.dob ? user.dob.toISOString().slice(0, 10) : null,
      gender: user.gender === "Men" ? "Male" : user.gender === "Women" ? "Female" : user.gender === "MALE" ? "Male" : user.gender === "FEMALE" ? "Female" : null,
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
      isPremium: Boolean(user.is_premium),
      premiumUntil: user.premium_until ? user.premium_until.toISOString() : null,
      lastSignInAt: user.last_sign_in_at ? user.last_sign_in_at.toISOString() : null,
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
