import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSupabaseServer } from "@/lib/supabase";
import { verifyLegacyToken } from "@/lib/jwt";

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

    let dbUser: any = null;

    if (token) {
      // 尝试 Supabase JWT
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user && !error) {
        dbUser = await prisma.users.findUnique({ where: { supabase_user_id: user.id } });
      }

      // 如果 Supabase 校验失败，尝试本地 JWT（legacy）
      if (!dbUser) {
        const v = verifyLegacyToken(token);
        if (v.valid && v.payload?.uid) {
          dbUser = await prisma.users.findUnique({ where: { id: Number(v.payload.uid) } });
        }
      }
    }

    if (!dbUser) {
      return null;
    }

    return dbUser;
  } catch (err) {
    console.error("❌ getCurrentUser failed:", err);
    return null;
  }
}

/**
 * POST /api/users/[username]/follow - 关注用户
 */
export async function POST(req: NextRequest, context: { params: Promise<{ username: string }> }) {
  try {
    const params = await context.params;
    const targetUsername = params.username;

    // 获取当前登录用户
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
