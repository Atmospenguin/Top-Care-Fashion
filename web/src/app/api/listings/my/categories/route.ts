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
      // 优先尝试本地 JWT（legacy）
      const v = verifyLegacyToken(token);
      if (v.valid && v.payload?.uid) {
        dbUser = await prisma.users.findUnique({ where: { id: Number(v.payload.uid) } });
      }

      // 再尝试 Supabase JWT
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
 * 获取当前用户listings中实际使用的分类
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("📖 Loading categories for user:", user.id);

    // 获取用户listings中实际使用的分类（只计算active listings）
    const categories = await prisma.listing_categories.findMany({
      where: {
        listings: {
          some: {
            seller_id: user.id,
            listed: true,
            sold: false,
          },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: {
            listings: {
              where: {
                seller_id: user.id,
                listed: true,
                sold: false,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // 格式化分类数据
    const formattedCategories = categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      count: category._count.listings,
    }));

    console.log(`✅ Found ${formattedCategories.length} categories for user ${user.id}`);

    return NextResponse.json({
      success: true,
      categories: formattedCategories,
    });

  } catch (error) {
    console.error("❌ Error fetching user categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
