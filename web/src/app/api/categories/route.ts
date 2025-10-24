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
    const organizedCategories: Record<'men'|'women'|'unisex', Record<string, string[]>> = {
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

    // 如果数据库没有按照 men-xxx 方式编码分类名，提供一个合理的默认分类映射
    const isEmpty =
      Object.keys(organizedCategories.men).length === 0 &&
      Object.keys(organizedCategories.women).length === 0 &&
      Object.keys(organizedCategories.unisex).length === 0;

    if (isEmpty) {
      const defaultMap: Record<'men'|'women'|'unisex', Record<string, string[]>> = {
        men: {
          Tops: ['t-shirts', 'shirts', 'sweaters', 'hoodies', 'polos', 'other'],
          Bottoms: ['jeans', 'trousers', 'shorts', 'joggers', 'other'],
          Outerwear: ['jackets', 'coats', 'blazers', 'vests', 'other'],
          Shoes: ['sneakers', 'boots', 'loafers', 'sandals', 'other'],
          Accessories: ['belts', 'hats', 'sunglasses', 'bags', 'other'],
        },
        women: {
          Dresses: ['casual', 'evening', 'party', 'other'],
          Tops: ['t-shirts', 'blouses', 'knitwear', 'hoodies', 'other'],
          Bottoms: ['jeans', 'leggings', 'skirts', 'shorts', 'other'],
          Outerwear: ['jackets', 'coats', 'blazers', 'other'],
          Shoes: ['sneakers', 'boots', 'heels', 'sandals', 'other'],
          Accessories: ['belts', 'hats', 'sunglasses', 'bags', 'other'],
        },
        unisex: {
          Tops: ['t-shirts', 'sweatshirts', 'hoodies', 'other'],
          Bottoms: ['jeans', 'pants', 'shorts', 'other'],
          Outerwear: ['jackets', 'coats', 'other'],
          Shoes: ['sneakers', 'boots', 'sandals', 'other'],
          Accessories: ['hats', 'sunglasses', 'bags', 'other'],
        },
      };
      return NextResponse.json({ success: true, data: defaultMap });
    }

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
