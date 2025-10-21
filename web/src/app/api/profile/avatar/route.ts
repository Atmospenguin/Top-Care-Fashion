import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const avatarFile = formData.get('avatar') as File;
    
    if (!avatarFile) {
      return NextResponse.json({ error: "No avatar file provided" }, { status: 400 });
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(avatarFile.type)) {
      return NextResponse.json({ 
        error: "Invalid file type. Only JPEG, PNG, and WebP images are allowed." 
      }, { status: 400 });
    }

    // 验证文件大小 (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (avatarFile.size > maxSize) {
      return NextResponse.json({ 
        error: "File too large. Maximum size is 5MB." 
      }, { status: 400 });
    }

    // 上传到 Supabase Storage
    const supabase = await createSupabaseServer();
    
    // 生成唯一的文件名
    const fileExtension = avatarFile.name.split('.').pop() || 'jpg';
    const fileName = `avatar-${sessionUser.id}-${Date.now()}.${fileExtension}`;
    
    // 上传文件到 Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, avatarFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json({ 
        error: "Failed to upload to storage" 
      }, { status: 500 });
    }

    // 获取公开 URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    const avatarUrl = urlData.publicUrl;

    // 更新用户头像
    await prisma.users.update({
      where: { id: Number(sessionUser.id) },
      data: { avatar_url: avatarUrl }
    });

    return NextResponse.json({ 
      avatarUrl: avatarUrl,
      message: "Avatar uploaded successfully" 
    });

  } catch (error: any) {
    console.error("Avatar upload error:", error);
    return NextResponse.json({ 
      error: error?.message || "Failed to upload avatar" 
    }, { status: 500 });
  }
}

export async function DELETE() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 删除用户头像
    await prisma.users.update({
      where: { id: Number(sessionUser.id) },
      data: { avatar_url: null }
    });

    return NextResponse.json({ 
      message: "Avatar deleted successfully" 
    });

  } catch (error: any) {
    console.error("Avatar deletion error:", error);
    return NextResponse.json({ 
      error: error?.message || "Failed to delete avatar" 
    }, { status: 500 });
  }
}

