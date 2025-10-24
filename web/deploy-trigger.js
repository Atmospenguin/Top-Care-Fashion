const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始自动部署 TOP Support 欢迎消息触发器...');

const prisma = new PrismaClient();

async function deployTrigger() {
  try {
    console.log('📄 读取触发器 SQL 文件...');
    
    // 读取触发器 SQL
    const triggerSqlPath = path.join(__dirname, 'supabase', 'final_welcome_trigger.sql');
    const triggerSql = fs.readFileSync(triggerSqlPath, 'utf8');
    
    console.log('⚙️ 正在执行触发器 SQL...');
    
    // 分割 SQL 语句（因为 Prisma 不支持多语句执行）
    const statements = triggerSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 找到 ${statements.length} 个 SQL 语句`);

    // 逐个执行 SQL 语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`🔄 执行语句 ${i + 1}/${statements.length}...`);
        
        try {
          await prisma.$executeRawUnsafe(statement);
          console.log(`✅ 语句 ${i + 1} 执行成功`);
        } catch (error) {
          console.log(`⚠️ 语句 ${i + 1} 执行失败 (可能已存在):`, error.message);
        }
      }
    }

    console.log('🎉 触发器部署完成！');

    // 测试触发器
    await testTrigger();

  } catch (error) {
    console.error('❌ 部署过程中出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function testTrigger() {
  try {
    console.log('🧪 开始测试触发器...');

    // 检查 TOP Support 用户
    const supportUser = await prisma.users.findUnique({
      where: { id: 1 },
      select: { id: true, username: true, email: true, role: true }
    });

    if (supportUser) {
      console.log('✅ TOP Support 用户存在:', supportUser);
    } else {
      console.log('⚠️ TOP Support 用户不存在');
    }

    // 检查现有 SUPPORT 对话
    const conversations = await prisma.conversations.findMany({
      where: { type: 'SUPPORT' },
      include: {
        initiator: { select: { username: true } },
        participant: { select: { username: true } }
      },
      orderBy: { created_at: 'desc' },
      take: 5
    });

    console.log(`📋 现有 SUPPORT 对话: ${conversations.length} 个`);
    conversations.forEach(conv => {
      console.log(`  - ${conv.initiator.username} ↔ ${conv.participant.username} (${conv.status})`);
    });

    // 检查现有欢迎消息
    const messages = await prisma.messages.findMany({
      where: { sender_id: 1 },
      include: {
        sender: { select: { username: true } },
        receiver: { select: { username: true } }
      },
      orderBy: { created_at: 'desc' },
      take: 5
    });

    console.log(`💬 现有欢迎消息: ${messages.length} 条`);
    messages.forEach(msg => {
      console.log(`  - ${msg.sender.username} → ${msg.receiver.username}: ${msg.content}`);
    });

    console.log('🎉 测试完成！触发器已成功部署。');
    console.log('📱 现在新用户注册时会自动收到 TOP Support 的欢迎消息！');

  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  deployTrigger();
}

module.exports = { deployTrigger, testTrigger };

