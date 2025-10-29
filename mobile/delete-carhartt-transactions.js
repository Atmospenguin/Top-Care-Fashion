#!/usr/bin/env node

/**
 * 删除Carhartt bags的所有交易记录脚本
 * 目标：让Carhartt bags重新能够售卖
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteCarharttTransactions() {
  console.log('🔥 开始删除Carhartt bags的交易记录...');
  
  try {
    // 1. 查找Carhartt bags商品
    const carharttListing = await prisma.listings.findFirst({
      where: {
        OR: [
          { name: { contains: 'Carhartt bags', mode: 'insensitive' } },
          { name: { contains: 'carhartt bags', mode: 'insensitive' } }
        ]
      }
    });

    if (!carharttListing) {
      console.log('❌ 未找到Carhartt bags商品');
      return;
    }

    console.log(`✅ 找到Carhartt bags商品: ID ${carharttListing.id}, 名称: ${carharttListing.name}`);
    console.log(`📊 当前状态: sold=${carharttListing.sold}, listed=${carharttListing.listed}`);

    // 2. 查找相关订单
    const orders = await prisma.orders.findMany({
      where: { listing_id: carharttListing.id }
    });

    console.log(`📦 找到 ${orders.length} 个相关订单`);

    // 3. 查找相关对话
    const conversations = await prisma.conversations.findMany({
      where: { listing_id: carharttListing.id }
    });

    console.log(`💬 找到 ${conversations.length} 个相关对话`);

    // 4. 删除相关消息
    for (const conversation of conversations) {
      const messageCount = await prisma.messages.count({
        where: { conversation_id: conversation.id }
      });
      
      if (messageCount > 0) {
        await prisma.messages.deleteMany({
          where: { conversation_id: conversation.id }
        });
        console.log(`🗑️ 删除了对话 ${conversation.id} 中的 ${messageCount} 条消息`);
      }
    }

    // 5. 删除相关对话
    if (conversations.length > 0) {
      await prisma.conversations.deleteMany({
        where: { listing_id: carharttListing.id }
      });
      console.log(`🗑️ 删除了 ${conversations.length} 个相关对话`);
    }

    // 6. 删除相关订单项
    const orderItems = await prisma.order_items.findMany({
      where: { listing_id: carharttListing.id }
    });

    if (orderItems.length > 0) {
      await prisma.order_items.deleteMany({
        where: { listing_id: carharttListing.id }
      });
      console.log(`🗑️ 删除了 ${orderItems.length} 个相关订单项`);
    }

    // 7. 删除相关订单
    if (orders.length > 0) {
      await prisma.orders.deleteMany({
        where: { listing_id: carharttListing.id }
      });
      console.log(`🗑️ 删除了 ${orders.length} 个相关订单`);
    }

    // 8. 删除相关交易记录
    const transactions = await prisma.transactions.findMany({
      where: { listing_id: carharttListing.id }
    });

    if (transactions.length > 0) {
      await prisma.transactions.deleteMany({
        where: { listing_id: carharttListing.id }
      });
      console.log(`🗑️ 删除了 ${transactions.length} 个相关交易记录`);
    }

    // 9. 删除相关评论
    const reviews = await prisma.reviews.findMany({
      where: { 
        order_id: { in: orders.map(o => o.id) }
      }
    });

    if (reviews.length > 0) {
      await prisma.reviews.deleteMany({
        where: { 
          order_id: { in: orders.map(o => o.id) }
        }
      });
      console.log(`🗑️ 删除了 ${reviews.length} 个相关评论`);
    }

    // 10. 重置商品状态
    await prisma.listings.update({
      where: { id: carharttListing.id },
      data: {
        sold: false,
        listed: true,
        sold_at: null,
        updated_at: new Date()
      }
    });

    console.log('✅ 重置商品状态: sold=false, listed=true');

    // 11. 验证结果
    const updatedListing = await prisma.listings.findUnique({
      where: { id: carharttListing.id }
    });

    console.log('\n🎉 删除完成！');
    console.log('📊 最终状态:');
    console.log(`   - 商品ID: ${updatedListing.id}`);
    console.log(`   - 商品名称: ${updatedListing.name}`);
    console.log(`   - 销售状态: ${updatedListing.sold}`);
    console.log(`   - 上架状态: ${updatedListing.listed}`);
    console.log(`   - 销售时间: ${updatedListing.sold_at || 'null'}`);

    // 验证相关记录是否已删除
    const remainingOrders = await prisma.orders.count({
      where: { listing_id: carharttListing.id }
    });
    const remainingConversations = await prisma.conversations.count({
      where: { listing_id: carharttListing.id }
    });
    const remainingTransactions = await prisma.transactions.count({
      where: { listing_id: carharttListing.id }
    });

    console.log('\n🔍 验证结果:');
    console.log(`   - 剩余订单: ${remainingOrders}`);
    console.log(`   - 剩余对话: ${remainingConversations}`);
    console.log(`   - 剩余交易: ${remainingTransactions}`);

    if (remainingOrders === 0 && remainingConversations === 0 && remainingTransactions === 0) {
      console.log('✅ 所有交易记录已成功删除！');
      console.log('🎯 Carhartt bags现在可以重新售卖了！');
    } else {
      console.log('⚠️ 仍有部分记录未删除，请检查');
    }

  } catch (error) {
    console.error('❌ 删除过程中出现错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行脚本
deleteCarharttTransactions();
