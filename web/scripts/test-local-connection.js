const { Client } = require('pg');

async function testLocalConnection() {
  // 使用本地 .env 文件中的连接字符串
  const client = new Client({
    connectionString: "postgresql://postgres:Zf9sn76eNuK1ESta@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=disable"
  });

  try {
    console.log('🔄 测试本地连接...');
    await client.connect();
    console.log('✅ 本地连接成功！');
    
    const result = await client.query('SELECT NOW()');
    console.log('📊 数据库时间:', result.rows[0].now);
    
    await client.end();
    console.log('✅ 测试完成');
  } catch (error) {
    console.error('❌ 本地连接失败:', error.message);
    console.error('🔍 错误代码:', error.code);
  }
}

testLocalConnection();

