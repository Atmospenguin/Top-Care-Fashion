import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

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

    // 创建 data URL
    const dataUrl = `data:image/jpeg;base64,${imageData}`;

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
