// 测试 shop API 返回的结果
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testShopAPI() {
  try {
    // 查找 Cathy 的所有 active listings
    const user = await prisma.users.findUnique({
      where: { username: 'Cathy' },
      select: { id: true }
    });

    if (!user) {
      console.log('❌ 用户 Cathy 不存在');
      return;
    }

    console.log(`🔍 检查用户 Cathy (ID: ${user.id}) 的商品\n`);

    // 模拟 API 查询条件（status === 'active'）
    const whereCondition = {
      seller_id: user.id,
      listed: true,
      sold: false  // ✅ 已添加这个条件
    };

    const listings = await prisma.listings.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        listed: true,
        sold: true,
        sold_at: true,
        created_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log(`📦 Active listings (listed=true, sold=false): ${listings.length} 个\n`);
    
    if (listings.length > 0) {
      listings.forEach((listing, index) => {
        console.log(`${index + 1}. ${listing.name} (ID: ${listing.id})`);
        console.log(`   listed: ${listing.listed}, sold: ${listing.sold}`);
        console.log(`   created: ${listing.created_at}\n`);
      });
    } else {
      console.log('✅ 没有 active listings\n');
    }

    // 检查已售出的商品
    console.log('\n📦 Sold listings (sold=true):');
    const soldListings = await prisma.listings.findMany({
      where: {
        seller_id: user.id,
        sold: true
      },
      select: {
        id: true,
        name: true,
        listed: true,
        sold: true,
        sold_at: true
      }
    });

    soldListings.forEach((listing, index) => {
      console.log(`${index + 1}. ${listing.name} (ID: ${listing.id})`);
      console.log(`   listed: ${listing.listed}, sold: ${listing.sold}`);
      console.log(`   sold_at: ${listing.sold_at}\n`);
    });

  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testShopAPI();

