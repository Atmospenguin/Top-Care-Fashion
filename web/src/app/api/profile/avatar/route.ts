import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase";
import { prisma } from "@/lib/db";

/**
 * 上传头像
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    // 验证用户身份
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 获取数据库用户
    const dbUser = await prisma.users.findUnique({
      where: { supabase_user_id: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 解析FormData
    const formData = await req.formData();
    const file = formData.get("avatar") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 生成唯一文件名
    const fileExt = file.name.split('.').pop();
    const fileName = `avatar-${dbUser.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // 上传到Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    // 获取公开URL
    const { data: urlData } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(filePath);

    const avatarUrl = urlData.publicUrl;

    // 更新数据库中的头像URL
    await prisma.users.update({
      where: { id: dbUser.id },
      data: { avatar_url: avatarUrl },
    });

    return NextResponse.json({
      avatarUrl: avatarUrl,
      message: "Avatar uploaded successfully"
    });

  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * 删除头像
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    // 验证用户身份
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 获取数据库用户
    const dbUser = await prisma.users.findUnique({
      where: { supabase_user_id: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 清除数据库中的头像URL
    await prisma.users.update({
      where: { id: dbUser.id },
      data: { avatar_url: null },
    });

    return NextResponse.json({
      message: "Avatar deleted successfully"
    });

  } catch (error) {
    console.error("Avatar delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}