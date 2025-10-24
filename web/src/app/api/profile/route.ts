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
      // 优先尝试本地 JWT（legacy），避免对 Supabase 发起无效请求
      const v = verifyLegacyToken(token);
      if (v.valid && v.payload?.uid) {
        dbUser = await prisma.users.findUnique({ where: { id: Number(v.payload.uid) } });
      }

      // 如果不是本地 JWT，再尝试 Supabase JWT
      if (!dbUser) {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (user && !error) {
          dbUser = await prisma.users.findUnique({ where: { supabase_user_id: user.id } });
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
 * 获取用户资料
 */
export async function GET(req: NextRequest) {
  const dbUser = await getCurrentUser(req);
  if (!dbUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("📖 Loading profile for user:", dbUser.id);
  console.log("📖 Avatar URL:", dbUser.avatar_url);

  // 获取follow统计
  const userWithFollows = await prisma.users.findUnique({
    where: { id: dbUser.id },
    select: {
      id: true,
      username: true,
      email: true,
      phone_number: true,
      bio: true,
      location: true,
      dob: true,
      gender: true,
      avatar_url: true,
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

  if (!userWithFollows) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    user: {
      id: userWithFollows.id.toString(),
      username: userWithFollows.username,
      email: userWithFollows.email,
      phone: userWithFollows.phone_number,
      bio: userWithFollows.bio,
      location: userWithFollows.location,
      dob: userWithFollows.dob ? userWithFollows.dob.toISOString().slice(0, 10) : null,
      gender: userWithFollows.gender === "MALE" ? "Male" : userWithFollows.gender === "FEMALE" ? "Female" : null,
      avatar_url: userWithFollows.avatar_url,
      followersCount: userWithFollows.followers.length,
      followingCount: userWithFollows.following.length,
      preferred_styles: Array.isArray((dbUser as any)?.preferred_styles)
        ? (dbUser as any).preferred_styles
        : (dbUser as any)?.preferred_styles
        ? ((dbUser as any).preferred_styles as any)
        : [],
      preferred_size_top: (dbUser as any)?.preferred_size_top ?? null,
      preferred_size_bottom: (dbUser as any)?.preferred_size_bottom ?? null,
      preferred_size_shoe: (dbUser as any)?.preferred_size_shoe ?? null,
      followersCount: userWithFollows.followers.length,
      followingCount: userWithFollows.following.length,
    },
  });
}

/**
 * 更新用户资料
 */
export async function PATCH(req: NextRequest) {
  try {
    const dbUser = await getCurrentUser(req);
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    console.log("📝 Profile update request data:", JSON.stringify(data, null, 2));
    console.log("📝 Current user ID:", dbUser.id);

    // ✅ 防覆盖更新：只更新有值的字段
    const updateData: any = {};
    
    // 过滤掉 undefined 和 null 值，只更新实际有值的字段
    if (data.username !== undefined && data.username !== null) {
      updateData.username = data.username;
    }
    if (data.email !== undefined && data.email !== null) {
      updateData.email = data.email;
    }
    if (data.phone !== undefined && data.phone !== null) {
      updateData.phone_number = data.phone;
    }
    if (data.bio !== undefined && data.bio !== null) {
      updateData.bio = data.bio;
    }
    if (data.location !== undefined && data.location !== null) {
      updateData.location = data.location;
    }
    if (data.dob !== undefined && data.dob !== null) {
      updateData.dob = new Date(data.dob);
    }
    if (data.gender !== undefined && data.gender !== null) {
      // 转换移动端的性别格式到数据库格式
      if (data.gender === "Male") {
        updateData.gender = "MALE";
      } else if (data.gender === "Female") {
        updateData.gender = "FEMALE";
      } else {
        updateData.gender = null;
      }
    }
    if (data.avatar_url !== undefined && data.avatar_url !== null) {
      updateData.avatar_url = data.avatar_url;
    }

    // 偏好：样式（数组）
    if (data.preferredStyles !== undefined) {
      if (Array.isArray(data.preferredStyles)) {
        updateData.preferred_styles = data.preferredStyles;
      } else if (data.preferredStyles === null) {
        updateData.preferred_styles = null;
      }
    }

    // 偏好：尺寸（对象）
    if (data.preferredSizes !== undefined && data.preferredSizes !== null) {
      const sizes = data.preferredSizes as any;
      if (Object.prototype.hasOwnProperty.call(sizes, 'top')) {
        updateData.preferred_size_top = sizes.top ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(sizes, 'bottom')) {
        updateData.preferred_size_bottom = sizes.bottom ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(sizes, 'shoe')) {
        updateData.preferred_size_shoe = sizes.shoe ?? null;
      }
    }

    console.log("📝 Update data prepared:", JSON.stringify(updateData, null, 2));

    // ✅ 检查是否有实际要更新的字段
    if (Object.keys(updateData).length === 0) {
      console.log("📝 No fields to update, returning current user data");
      return NextResponse.json({
        ok: true,
        user: {
          id: dbUser.id,
          username: dbUser.username,
          email: dbUser.email,
          phone: dbUser.phone_number,
          bio: dbUser.bio,
          location: dbUser.location,
          dob: dbUser.dob ? dbUser.dob.toISOString().slice(0, 10) : null,
          gender: dbUser.gender === "MALE" ? "Male" : dbUser.gender === "FEMALE" ? "Female" : null,
          avatar_url: dbUser.avatar_url,
        },
      });
    }

    const updated = await prisma.users.update({
      where: { id: dbUser.id },
      data: updateData,
    });

    console.log("✅ Profile updated successfully");

    return NextResponse.json({
      ok: true,
      user: {
        id: updated.id,
        username: updated.username,
        email: updated.email,
        phone: updated.phone_number,
        bio: updated.bio,
        location: updated.location,
        dob: updated.dob ? updated.dob.toISOString().slice(0, 10) : null,
        gender: updated.gender === "MALE" ? "Male" : updated.gender === "FEMALE" ? "Female" : null,
        avatar_url: updated.avatar_url,
        preferred_styles: Array.isArray((updated as any)?.preferred_styles)
          ? (updated as any).preferred_styles
          : (updated as any)?.preferred_styles
          ? ((updated as any).preferred_styles as any)
          : [],
        preferred_size_top: (updated as any)?.preferred_size_top ?? null,
        preferred_size_bottom: (updated as any)?.preferred_size_bottom ?? null,
        preferred_size_shoe: (updated as any)?.preferred_size_shoe ?? null,
      },
    });
  } catch (err) {
    console.error("❌ Update profile failed:", err);
    console.error("❌ Error details:", JSON.stringify(err, null, 2));
    return NextResponse.json({ 
      error: "Update failed", 
      details: err instanceof Error ? err.message : "Unknown error" 
    }, { status: 400 });
  }
}
