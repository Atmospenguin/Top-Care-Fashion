// 直接查询 Supabase 数据库
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkListings() {
  try {
    console.log('🔍 Checking listings in Supabase database...');
    
    // 查询所有 listings
    const listings = await prisma.listings.findMany({
      include: {
        seller: {
          select: {
            username: true,
            avatar_url: true,
          }
        },
        category: {
          select: {
            name: true,
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: 10
    });
    
    console.log(`📊 Found ${listings.length} listings:`);
    listings.forEach((listing, index) => {
      console.log(`${index + 1}. ${listing.title} - $${listing.price} (${listing.seller?.username})`);
      console.log(`   Category: ${listing.category?.name}`);
      console.log(`   Created: ${listing.created_at}`);
      console.log(`   Tags: ${listing.tags || 'None'}`);
      console.log('---');
    });
    
    // 查询分类
    const categories = await prisma.listing_categories.findMany({
      orderBy: { name: 'asc' },
      take: 20
    });
    
    console.log(`📂 Found ${categories.length} categories:`);
    categories.forEach((category, index) => {
      console.log(`${index + 1}. ${category.name} (ID: ${category.id})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkListings();
