// 检查特定用户的商品状态
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkListingStatus() {
  try {
    console.log('🔍 检查商品状态...\n');

    // 查找包含 "adidas" 或 "nike" 的商品
    const listings = await prisma.listings.findMany({
      where: {
        OR: [
          { name: { contains: 'adidas', mode: 'insensitive' } },
          { name: { contains: 'nike', mode: 'insensitive' } },
          { name: { contains: 'dunk', mode: 'insensitive' } },
          { name: { contains: 'jumper', mode: 'insensitive' } }
        ]
      },
      include: {
        orders: {
          select: {
            id: true,
            status: true,
            created_at: true,
            buyer_id: true,
            seller_id: true
          },
          orderBy: {
            created_at: 'desc'
          }
        },
        seller: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    console.log(`找到 ${listings.length} 个相关商品：\n`);

    listings.forEach((listing, index) => {
      console.log(`\n${index + 1}. ${listing.name} (ID: ${listing.id})`);
      console.log(`   卖家: ${listing.seller?.username} (ID: ${listing.seller_id})`);
      console.log(`   listed: ${listing.listed}`);
      console.log(`   sold: ${listing.sold}`);
      console.log(`   sold_at: ${listing.sold_at}`);
      console.log(`   创建时间: ${listing.created_at}`);
      
      if (listing.orders && listing.orders.length > 0) {
        console.log(`   订单:`);
        listing.orders.forEach(order => {
          console.log(`     - Order #${order.id}: ${order.status} (${order.created_at})`);
        });
      } else {
        console.log(`   订单: 无`);
      }
    });

    // 统计状态
    console.log('\n\n📊 状态统计:');
    console.log(`   listed=true, sold=false: ${listings.filter(l => l.listed && !l.sold).length} 个 (active)`);
    console.log(`   listed=true, sold=true: ${listings.filter(l => l.listed && l.sold).length} 个 (已售出)`);
    console.log(`   listed=false, sold=false: ${listings.filter(l => !l.listed && !l.sold).length} 个 (草稿/unlisted)`);
    console.log(`   listed=false, sold=true: ${listings.filter(l => !l.listed && l.sold).length} 个 (异常状态)`);

  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkListingStatus();

