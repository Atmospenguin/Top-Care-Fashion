import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

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

    // 这里应该上传到云存储服务 (如 AWS S3, Cloudinary, 或 Supabase Storage)
    // 为了演示，我们使用一个简单的 base64 编码
    const bytes = await avatarFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${avatarFile.type};base64,${base64}`;

    // 更新用户头像
    await prisma.users.update({
      where: { id: Number(sessionUser.id) },
      data: { avatar_url: dataUrl }
    });

    return NextResponse.json({ 
      avatarUrl: dataUrl,
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
