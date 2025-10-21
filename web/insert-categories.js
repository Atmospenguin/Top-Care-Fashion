// 插入分类数据的 Node.js 脚本
// 运行方式: node insert-categories.js

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const categories = {
  men: {
    Tops: ["T-shirts", "Hoodies", "Shirts", "Sweaters", "Crop tops", "Tank tops", "Other"],
    Bottoms: ["Jeans", "Pants", "Shorts", "Skirts", "Leggings", "Other"],
    Outerwear: ["Jackets", "Coats", "Vests", "Blazers", "Other"],
    Footwear: ["Sneakers", "Boots", "Loafers", "Sandals", "Slippers", "Other"],
    Accessories: ["Bags", "Hats and caps", "Jewelry", "Sunglasses", "Watches", "Scarves", "Belts", "Other"],
  },
  women: {
    Tops: ["T-shirts", "Blouses", "Crop tops", "Tank tops", "Hoodies", "Sweaters", "Other"],
    Bottoms: ["Jeans", "Skirts", "Pants", "Leggings", "Shorts", "Other"],
    Outerwear: ["Jackets", "Coats", "Blazers", "Cardigans", "Other"],
    Footwear: ["Sneakers", "Boots", "Heels", "Flats", "Sandals", "Other"],
    Accessories: ["Bags", "Jewelry", "Sunglasses", "Belts", "Hair accessories", "Other"],
    Dresses: ["Mini dresses", "Midi dresses", "Maxi dresses", "Bodycon", "Other"],
  },
  unisex: {
    Tops: ["T-shirts", "Hoodies", "Shirts", "Sweaters", "Other"],
    Bottoms: ["Jeans", "Pants", "Shorts", "Joggers", "Other"],
    Outerwear: ["Jackets", "Coats", "Vests", "Other"],
    Footwear: ["Sneakers", "Boots", "Sandals", "Other"],
    Accessories: ["Bags", "Hats and caps", "Sunglasses", "Jewelry", "Other"],
    Dresses: ["Casual dresses", "Oversized shirt dresses", "Other"],
  },
};

async function insertCategories() {
  try {
    console.log('🚀 Starting category insertion...');
    
    // 插入性别分类
    const genderCategories = {};
    for (const gender of ['men', 'women', 'unisex']) {
      const category = await prisma.listing_categories.create({
        data: {
          name: gender,
          description: `${gender.charAt(0).toUpperCase() + gender.slice(1)}'s Clothing`,
        },
      });
      genderCategories[gender] = category.id;
      console.log(`✅ Created ${gender} category with ID: ${category.id}`);
    }
    
    // 插入主分类和子分类
    for (const [gender, mainCategories] of Object.entries(categories)) {
      const genderId = genderCategories[gender];
      
      for (const [mainCategory, subcategories] of Object.entries(mainCategories)) {
        // 插入主分类
        const mainCat = await prisma.listing_categories.create({
          data: {
            name: `${gender}-${mainCategory.toLowerCase()}`,
            description: `${gender.charAt(0).toUpperCase() + gender.slice(1)}'s ${mainCategory}`,
          },
        });
        console.log(`✅ Created ${gender} ${mainCategory} with ID: ${mainCat.id}`);
        
        // 插入子分类
        for (const subcategory of subcategories) {
          await prisma.listing_categories.create({
            data: {
              name: `${gender}-${mainCategory.toLowerCase()}-${subcategory.toLowerCase().replace(/\s+/g, '-')}`,
              description: `${gender.charAt(0).toUpperCase() + gender.slice(1)}'s ${subcategory}`,
            },
          });
          console.log(`  ✅ Created ${gender} ${mainCategory} > ${subcategory}`);
        }
      }
    }
    
    console.log('🎉 All categories inserted successfully!');
    
  } catch (error) {
    console.error('❌ Error inserting categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

insertCategories();
