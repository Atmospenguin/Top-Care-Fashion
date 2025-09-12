const mysql = require('mysql2/promise');

async function checkDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'top_care_fashion'
    });

    console.log('=== 数据库验证报告 ===\n');

    // 检查 feedback 表
    const [feedbackRows] = await connection.execute('SELECT COUNT(*) as count FROM feedback');
    console.log(`📝 Feedback 表记录数: ${feedbackRows[0].count}`);

    const [feedbackSample] = await connection.execute('SELECT user_name, user_email, message, rating FROM feedback LIMIT 3');
    console.log('📝 Feedback 样本数据:');
    feedbackSample.forEach((row, i) => {
      console.log(`   ${i+1}. ${row.user_name || '匿名'} (${row.user_email || '无邮箱'}) - 评分: ${row.rating || 'N/A'}`);
      console.log(`      消息: ${row.message.substring(0, 50)}...`);
    });

    // 检查 site_stats 表
    const [statsRows] = await connection.execute('SELECT * FROM site_stats');
    console.log(`\n📊 Site Stats 表记录数: ${statsRows.length}`);
    if (statsRows.length > 0) {
      const stats = statsRows[0];
      console.log(`📊 Stats 数据: 用户${stats.total_users}, 商品${stats.total_listings}, 已售${stats.total_sold}, 评分${stats.avg_rating}`);
    }

    // 检查 pricing_plans 表
    const [plansRows] = await connection.execute('SELECT COUNT(*) as count FROM pricing_plans');
    console.log(`\n💰 Pricing Plans 表记录数: ${plansRows[0].count}`);

    const [plansSample] = await connection.execute('SELECT plan_type, name, price_monthly FROM pricing_plans');
    console.log('💰 Plans 数据:');
    plansSample.forEach((plan, i) => {
      console.log(`   ${i+1}. ${plan.plan_type}: ${plan.name} - $${plan.price_monthly}/月`);
    });

    // 检查 FAQ 表中有 user_id 和 user_email 的记录
    const [faqWithUser] = await connection.execute('SELECT COUNT(*) as count FROM faq WHERE user_id IS NOT NULL OR user_email IS NOT NULL');
    console.log(`\n❓ FAQ 表中有用户信息的记录数: ${faqWithUser[0].count}`);

    await connection.end();
    console.log('\n✅ 数据库验证完成！');
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
  }
}

checkDatabase();
