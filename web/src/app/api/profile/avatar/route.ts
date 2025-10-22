import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    // 1️⃣ 从 Authorization 头获取 Bearer token
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error: authError } = await supabase.auth.getUser(token);
    if (authError || !data?.user) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const user = data.user;

    // 2️⃣ 查找数据库用户
    const dbUser = await prisma.users.findUnique({
      where: { supabase_user_id: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3️⃣ 从 FormData 获取文件（⚠️ key 必须是 "file"）
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    
    // ✅ 添加详细日志调试
    console.log("📸 Received FormData keys:", Array.from(formData.keys()));
    console.log("📸 File object:", file);
    console.log("📸 File type:", file?.type);
    console.log("📸 File size:", file?.size);
    console.log("📸 File name:", file?.name);

    if (!file) {
      console.error("❌ No file provided in FormData");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 4️⃣ 转换为 Buffer（Node 环境必须手动转换）
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 5️⃣ 上传到 Supabase Storage（⚠️ 使用 avatars bucket）
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `avatar-${dbUser.id}-${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars") // ✅ 改为统一 avatars bucket
      .upload(fileName, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("❌ Supabase upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // 6️⃣ 获取 public URL
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    const avatarUrl = urlData.publicUrl;

    // 7️⃣ 更新数据库
    await prisma.users.update({
      where: { id: dbUser.id },
      data: { avatar_url: avatarUrl },
    });

    console.log("✅ Avatar uploaded:", avatarUrl);

    return NextResponse.json({
      ok: true,
      avatarUrl,
      message: "Avatar uploaded successfully",
    });
  } catch (err) {
    console.error("❌ Avatar upload error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error: authError } = await supabase.auth.getUser(token);
    if (authError || !data?.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const dbUser = await prisma.users.findUnique({
      where: { supabase_user_id: data.user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 清除数据库中的头像
    await prisma.users.update({
      where: { id: dbUser.id },
      data: { avatar_url: null },
    });

    return NextResponse.json({ ok: true, message: "Avatar deleted" });
  } catch (error) {
    console.error("Avatar delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
