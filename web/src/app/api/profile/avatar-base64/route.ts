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
    const body = await req.json();
    const { imageData, fileName } = body;
    
    if (!imageData) {
      return NextResponse.json({ error: "No image data provided" }, { status: 400 });
    }

    // 验证 base64 数据
    if (typeof imageData !== 'string') {
      return NextResponse.json({ error: "Invalid image data format" }, { status: 400 });
    }

    // 上传到 Supabase Storage
    const supabase = await createSupabaseServer();
    
    // 生成唯一的文件名
    const fileExtension = fileName?.split('.').pop() || 'jpg';
    const uniqueFileName = `avatar-${sessionUser.id}-${Date.now()}.${fileExtension}`;
    
    // 将 base64 转换为 Buffer
    const buffer = Buffer.from(imageData, 'base64');
    
    // 上传文件到 Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(uniqueFileName, buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg'
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
      .getPublicUrl(uniqueFileName);

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
