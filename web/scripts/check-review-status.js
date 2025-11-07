const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkReviewStatus() {
  try {
    // 查找 Cindy 和 Cathy 之间关于 UGG boots 的订单
    const conversations = await prisma.conversations.findMany({
      where: {
        OR: [
          { initiator_id: 33, participant_id: 56 }, // Cindy -> Cathy
          { initiator_id: 56, participant_id: 33 }, // Cathy -> Cindy
        ],
        listing_id: 62 // UGG boots
      },
      include: {
        initiator: { select: { username: true } },
        participant: { select: { username: true } },
        listing: { select: { name: true } }
      }
    });

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Found ${conversations.length} conversations about UGG boots`);
    console.log('='.repeat(60));

    for (const conv of conversations) {
      console.log(`\n📋 Conversation ID: ${conv.id}`);
      console.log(`   ${conv.initiator.username} <-> ${conv.participant?.username}`);
      console.log(`   Listing: ${conv.listing?.name}`);

      // 查找订单
      const orders = await prisma.orders.findMany({
        where: {
          listing_id: conv.listing_id,
          OR: [
            { buyer_id: conv.initiator_id, seller_id: conv.participant_id },
            { buyer_id: conv.participant_id, seller_id: conv.initiator_id }
          ]
        },
        orderBy: { created_at: 'desc' }
      });

      console.log(`\n   Found ${orders.length} order(s):`);
      
      for (const order of orders) {
        console.log(`\n   📦 Order ID: ${order.id}`);
        console.log(`      Buyer ID: ${order.buyer_id}`);
        console.log(`      Seller ID: ${order.seller_id}`);
        console.log(`      Status: ${order.status}`);
        console.log(`      Created: ${order.created_at}`);
        console.log(`      Updated: ${order.updated_at}`);

        // 查找评论
        const reviews = await prisma.reviews.findMany({
          where: { order_id: order.id },
          include: {
            reviewer: { select: { id: true, username: true } }
          }
        });

        console.log(`\n      Reviews (${reviews.length}):`);
        if (reviews.length === 0) {
          console.log(`      ❌ No reviews yet`);
        } else {
          reviews.forEach(review => {
            console.log(`      ✅ ${review.reviewer.username} (ID: ${review.reviewer.id})`);
            console.log(`         Rating: ${review.rating}/5`);
            console.log(`         Comment: "${review.comment || 'No comment'}"`);
            console.log(`         Created: ${review.created_at}`);
          });
        }

        // 判断谁应该看到什么消息
        const hasBuyerReview = reviews.some(r => r.reviewer_id === order.buyer_id);
        const hasSellerReview = reviews.some(r => r.reviewer_id === order.seller_id);

        console.log(`\n      Review Status:`);
        console.log(`      - Buyer reviewed: ${hasBuyerReview ? '✅' : '❌'}`);
        console.log(`      - Seller reviewed: ${hasSellerReview ? '✅' : '❌'}`);

        // 查找最后一条消息
        const lastMessage = await prisma.messages.findFirst({
          where: { conversation_id: conv.id },
          orderBy: { created_at: 'desc' }
        });

        console.log(`\n      Last Message:`);
        console.log(`      - Content: "${lastMessage?.content || 'N/A'}"`);
        console.log(`      - Type: ${lastMessage?.message_type || 'N/A'}`);
        console.log(`      - Created: ${lastMessage?.created_at || 'N/A'}`);

        console.log(`\n      Time Comparison:`);
        console.log(`      - Order updated_at: ${order.updated_at}`);
        console.log(`      - Last message created_at: ${lastMessage?.created_at}`);
        console.log(`      - Order is newer: ${order.updated_at > (lastMessage?.created_at || new Date(0)) ? '✅' : '❌'}`);

        // 决定 Inbox 应该显示什么
        const orderIsNewer = order.updated_at > (lastMessage?.created_at || new Date(0));
        console.log(`\n      📬 Inbox should show:`);
        
        if (['RECEIVED', 'COMPLETED', 'REVIEWED'].includes(order.status) && orderIsNewer) {
          if (hasBuyerReview && hasSellerReview) {
            console.log(`      "Both parties reviewed each other."`);
          } else if (hasBuyerReview) {
            console.log(`      For Buyer (Cindy): "You left a review. Waiting for seller's review."`);
            console.log(`      For Seller (Cathy): "Buyer left a review. Leave yours now!"`);
          } else if (hasSellerReview) {
            console.log(`      For Seller (Cathy): "You left a review. Waiting for buyer's review."`);
            console.log(`      For Buyer (Cindy): "Seller left a review. Leave yours now!"`);
          } else {
            console.log(`      "How was your experience? Leave a review!"`);
          }
        } else {
          console.log(`      Latest message: "${lastMessage?.content || 'N/A'}"`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkReviewStatus();

