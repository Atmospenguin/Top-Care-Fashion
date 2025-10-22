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
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
      }
    }

    if (!userId) {
      return null;
    }

    // 查询本地数据库用户
    const dbUser = await prisma.users.findUnique({
      where: { supabase_user_id: userId },
    });

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

  return NextResponse.json({
    id: dbUser.id,
    username: dbUser.username,
    email: dbUser.email,
    phone: dbUser.phone_number,
    bio: dbUser.bio,
    location: dbUser.location,
    dob: dbUser.dob,
    gender: dbUser.gender,
    avatar_url: dbUser.avatar_url,
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