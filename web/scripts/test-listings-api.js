// 测试修复后的 listings API
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testListingsAPI() {
  try {
    console.log('🔍 Testing listings API...');
    
    // 查询 listings
    const listings = await prisma.listings.findMany({
      where: {
        listed: true,
        sold: false,
      },
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
      take: 5
    });
    
    console.log(`📊 Found ${listings.length} active listings:`);
    listings.forEach((listing, index) => {
      console.log(`${index + 1}. ${listing.name || 'No title'} - $${listing.price} (${listing.seller?.username})`);
      console.log(`   Category: ${listing.category?.name || 'No category'}`);
      console.log(`   Condition: ${listing.condition_type || 'No condition'}`);
      console.log(`   Material: ${listing.material || 'No material'}`);
      console.log(`   Tags: ${listing.tags || 'No tags'}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testListingsAPI();
