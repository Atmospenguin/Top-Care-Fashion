const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 从环境变量或手动输入获取 Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project-ref.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

console.log('🚀 开始自动执行 TOP Support 欢迎消息触发器...');

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 读取触发器 SQL 文件
const triggerSqlPath = path.join(__dirname, 'supabase', 'final_welcome_trigger.sql');
const triggerSql = fs.readFileSync(triggerSqlPath, 'utf8');

console.log('📄 读取触发器 SQL 文件:', triggerSqlPath);

async function executeTrigger() {
  try {
    console.log('⚙️ 正在执行触发器...');
    
    // 执行 SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: triggerSql
    });

    if (error) {
      console.error('❌ 执行失败:', error);
      return;
    }

    console.log('✅ 触发器执行成功！');
    console.log('📊 结果:', data);

    // 测试触发器
    console.log('🧪 开始测试触发器...');
    await testTrigger();

  } catch (error) {
    console.error('❌ 执行过程中出错:', error);
  }
}

async function testTrigger() {
  try {
    // 检查 TOP Support 用户是否存在
    const { data: supportUser, error: userError } = await supabase
      .from('users')
      .select('id, username, email, role')
      .eq('id', 1)
      .single();

    if (userError) {
      console.log('⚠️ TOP Support 用户不存在，正在创建...');
    } else {
      console.log('✅ TOP Support 用户存在:', supportUser);
    }

    // 查看现有 SUPPORT 对话
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        initiator_id,
        participant_id,
        type,
        status,
        created_at,
        initiator:users!conversations_initiator_id_fkey(username),
        participant:users!conversations_participant_id_fkey(username)
      `)
      .eq('type', 'SUPPORT')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!convError && conversations) {
      console.log('📋 现有 SUPPORT 对话:', conversations.length, '个');
    }

    // 查看现有欢迎消息
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        receiver_id,
        content,
        created_at,
        sender:users!messages_sender_id_fkey(username),
        receiver:users!messages_receiver_id_fkey(username)
      `)
      .eq('sender_id', 1)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!msgError && messages) {
      console.log('💬 现有欢迎消息:', messages.length, '条');
      messages.forEach(msg => {
        console.log(`  - ${msg.sender.username} → ${msg.receiver.username}: ${msg.content}`);
      });
    }

    console.log('🎉 测试完成！触发器已成功部署。');

  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  executeTrigger();
}

module.exports = { executeTrigger, testTrigger };

