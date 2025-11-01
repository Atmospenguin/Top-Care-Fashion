// 修复已完成订单但商品状态未更新的问题
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSoldListings() {
  try {
    console.log('🔧 开始修复已售出商品的状态...\n');

    // 查找所有已完成的订单
    const completedOrders = await prisma.orders.findMany({
      where: {
        status: {
          in: ['RECEIVED', 'COMPLETED', 'REVIEWED']
        }
      },
      select: {
        id: true,
        status: true,
        listing_id: true
      }
    });

    const listingIds = completedOrders
      .filter(o => o.listing_id !== null)
      .map(o => o.listing_id);

    if (listingIds.length === 0) {
      console.log('✅ 没有已完成的订单，无需修复！\n');
      return;
    }

    // 查找这些订单对应的商品，看哪些 sold 状态还是 false
    const unsoldListings = await prisma.listings.findMany({
      where: {
        id: {
          in: listingIds
        },
        sold: false
      },
      select: {
        id: true,
        name: true,
        sold: true,
        sold_at: true
      }
    });

    const ordersWithUnsoldListings = completedOrders.filter(o =>
      unsoldListings.some(l => l.id === o.listing_id)
    ).map(o => ({
      ...o,
      listing: unsoldListings.find(l => l.id === o.listing_id)
    }));

    if (ordersWithUnsoldListings.length === 0) {
      console.log('✅ 所有商品状态都是正确的，无需修复！\n');
      return;
    }

    console.log(`⚠️  发现 ${ordersWithUnsoldListings.length} 个已完成订单，但商品状态未更新：\n`);
    
    ordersWithUnsoldListings.forEach((order, index) => {
      console.log(`${index + 1}. Order #${order.id} (${order.status})`);
      console.log(`   Listing: ${order.listing.name} (ID: ${order.listing.id})`);
      console.log(`   Current sold status: ${order.listing.sold}\n`);
    });

    // 更新商品状态
    const listingIdsToUpdate = ordersWithUnsoldListings.map(o => o.listing_id).filter(id => id !== null);
    
    const result = await prisma.listings.updateMany({
      where: {
        id: {
          in: listingIdsToUpdate
        }
      },
      data: {
        sold: true,
        sold_at: new Date()
      }
    });

    console.log(`\n✅ 成功更新 ${result.count} 个商品的状态为已售出！\n`);

    // 验证更新结果
    const updatedListings = await prisma.listings.findMany({
      where: {
        id: {
          in: listingIdsToUpdate
        }
      },
      select: {
        id: true,
        name: true,
        sold: true,
        sold_at: true
      }
    });

    console.log('📋 更新后的商品状态：\n');
    updatedListings.forEach((listing, index) => {
      console.log(`${index + 1}. ${listing.name} (ID: ${listing.id})`);
      console.log(`   sold: ${listing.sold}`);
      console.log(`   sold_at: ${listing.sold_at}\n`);
    });

  } catch (error) {
    console.error('❌ 修复失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSoldListings();

