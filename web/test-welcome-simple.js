const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testWelcomeMessage() {
  try {
    console.log('🧪 测试新用户欢迎消息功能...');

    // 1. 检查 TOP Support 用户
    const supportUser = await prisma.users.findUnique({
      where: { id: 1 }
    });

    if (!supportUser) {
      console.log('❌ TOP Support 用户不存在，请先执行触发器 SQL');
      return;
    }

    console.log('✅ TOP Support 用户存在:', supportUser.username);

    // 2. 创建测试用户
    const testUsername = 'test_' + Date.now();
    const testUser = await prisma.users.create({
      data: {
        username: testUsername,
        email: testUsername + '@example.com',
        role: 'USER',
        status: 'ACTIVE'
      }
    });

    console.log('✅ 创建测试用户:', testUser.username);

    // 3. 检查是否自动创建了对话
    const conversation = await prisma.conversations.findFirst({
      where: {
        initiator_id: testUser.id,
        participant_id: 1,
        type: 'SUPPORT'
      }
    });

    if (conversation) {
      console.log('✅ 自动创建了 TOP Support 对话');

      // 4. 检查是否自动发送了欢迎消息
      const welcomeMessage = await prisma.messages.findFirst({
        where: {
          conversation_id: conversation.id,
          sender_id: 1,
          receiver_id: testUser.id
        }
      });

      if (welcomeMessage) {
        console.log('✅ 自动发送了欢迎消息:', welcomeMessage.content);
      } else {
        console.log('❌ 没有找到欢迎消息');
      }
    } else {
      console.log('❌ 没有自动创建对话，触发器可能没有生效');
    }

    // 5. 清理测试数据
    await prisma.users.delete({
      where: { id: testUser.id }
    });
    console.log('🧹 清理测试数据完成');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testWelcomeMessage();

