const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixOrderTimestamp() {
  try {
    // 更新 Order 100 的 updated_at 为当前时间
    const result = await prisma.orders.update({
      where: { id: 100 },
      data: { updated_at: new Date() }
    });

    console.log('✅ Order 100 updated_at has been refreshed:');
    console.log(`   New updated_at: ${result.updated_at}`);
    console.log(`\nNow Cathy's Inbox should show: "Buyer left a review. Leave yours now!"`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixOrderTimestamp();

