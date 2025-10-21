import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // 获取所有分类
    const categories = await prisma.listing_categories.findMany({
      orderBy: [
        { name: 'asc' }
      ],
    });

    // 组织分类结构
    const organizedCategories = {
      men: {},
      women: {},
      unisex: {}
    };

    categories.forEach(category => {
      const name = category.name;
      
      // 解析分类名称
      if (name === 'men' || name === 'women' || name === 'unisex') {
        // 这是性别分类
        return;
      }
      
      // 解析主分类和子分类
      const parts = name.split('-');
      if (parts.length >= 2) {
        const gender = parts[0] as 'men' | 'women' | 'unisex';
        const mainCategory = parts[1];
        
        if (!organizedCategories[gender][mainCategory]) {
          organizedCategories[gender][mainCategory] = [];
        }
        
        if (parts.length === 3) {
          // 这是子分类
          const subcategory = parts[2].replace(/-/g, ' ');
          organizedCategories[gender][mainCategory].push(subcategory);
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: organizedCategories
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
