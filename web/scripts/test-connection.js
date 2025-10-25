const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    connectionString: "postgres://postgres.ilykxrtilsbymlncunua:Zf9sn76eNuK1ESta@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true",
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 尝试连接 Supabase...');
    await client.connect();
    console.log('✅ 连接成功！');
    
    const result = await client.query('SELECT version()');
    console.log('📊 数据库版本:', result.rows[0].version);
    
    await client.end();
    console.log('✅ 测试完成');
  } catch (error) {
    console.error('❌ 连接失败:', error.message);
    console.error('🔍 错误代码:', error.code);
  }
}

testConnection();
