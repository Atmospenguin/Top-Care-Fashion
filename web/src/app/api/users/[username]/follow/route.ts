import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// 统一走 getSessionUser(req) 鉴权，避免在路由内重复实现

/**
 * POST /api/users/[username]/follow - 关注用户
 */
export async function POST(req: NextRequest, context: { params: Promise<{ username: string }> }) {
  try {
    const params = await context.params;
    const targetUsername = params.username;

    // 获取当前登录用户
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const currentUser = sessionUser;

    // 找到要关注的用户
    const targetUser = await prisma.users.findUnique({
      where: { username: targetUsername },
      select: { id: true, username: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 检查是否已经在关注
    const existingFollow = await prisma.user_follows.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: currentUser.id,
          following_id: targetUser.id,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json({ 
        success: true, 
        message: "Already following this user",
        isFollowing: true 
      });
    }

    // 创建关注关系
    await prisma.user_follows.create({
      data: {
        follower_id: currentUser.id,
        following_id: targetUser.id,
      },
    });

  console.log(`✅ User ${currentUser.username} followed ${targetUser.username}`);

    return NextResponse.json({
      success: true,
      message: `Successfully followed ${targetUser.username}`,
      isFollowing: true,
    });

  } catch (error) {
    console.error("❌ Error following user:", error);
    return NextResponse.json(
      { error: "Failed to follow user" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[username]/follow - 取消关注用户
 */
export async function DELETE(req: NextRequest, context: { params: Promise<{ username: string }> }) {
  try {
    const params = await context.params;
    const targetUsername = params.username;

    // 获取当前登录用户
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const currentUser = sessionUser;

    // 找到要取消关注的用户
    const targetUser = await prisma.users.findUnique({
      where: { username: targetUsername },
      select: { id: true, username: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 删除关注关系
    const deletedFollow = await prisma.user_follows.deleteMany({
      where: {
        follower_id: currentUser.id,
        following_id: targetUser.id,
      },
    });

    if (deletedFollow.count === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "Not following this user",
        isFollowing: false 
      });
    }

    console.log(`✅ User ${currentUser.username} unfollowed ${targetUser.username}`);

    return NextResponse.json({
      success: true,
      message: `Successfully unfollowed ${targetUser.username}`,
      isFollowing: false,
    });

  } catch (error) {
    console.error("❌ Error unfollowing user:", error);
    return NextResponse.json(
      { error: "Failed to unfollow user" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users/[username]/follow - 检查关注状态
 */
export async function GET(req: NextRequest, context: { params: Promise<{ username: string }> }) {
  try {
    const params = await context.params;
    const targetUsername = params.username;

    // 获取当前登录用户
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const currentUser = sessionUser;

    // 找到目标用户
    const targetUser = await prisma.users.findUnique({
      where: { username: targetUsername },
      select: { id: true, username: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 检查关注状态
    const followRelation = await prisma.user_follows.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: currentUser.id,
          following_id: targetUser.id,
        },
      },
    });

    return NextResponse.json({
      success: true,
      isFollowing: !!followRelation,
    });

  } catch (error) {
    console.error("❌ Error checking follow status:", error);
    return NextResponse.json(
      { error: "Failed to check follow status" },
      { status: 500 }
    );
  }
}

