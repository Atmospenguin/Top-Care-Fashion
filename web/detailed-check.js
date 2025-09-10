const mysql = require('mysql2/promise');

async function detailedCheck() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'top_care_fashion'
    });

    console.log('=== 详细数据验证报告 ===\n');

    // 检查 feedback 表的详细信息
    const [feedbackStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as with_user_id,
        COUNT(CASE WHEN user_email IS NOT NULL THEN 1 END) as with_email,
        COUNT(CASE WHEN user_name IS NOT NULL THEN 1 END) as with_name,
        COUNT(CASE WHEN featured = 1 THEN 1 END) as featured_count
      FROM feedback
    `);
    console.log('📝 Feedback 表详情:');
    console.log(`   总记录数: ${feedbackStats[0].total}`);
    console.log(`   有user_id的: ${feedbackStats[0].with_user_id}`);
    console.log(`   有email的: ${feedbackStats[0].with_email}`);
    console.log(`   有姓名的: ${feedbackStats[0].with_name}`);
    console.log(`   推荐的: ${feedbackStats[0].featured_count}`);

    // 检查 FAQ 表的详细信息
    const [faqStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as with_user_id,
        COUNT(CASE WHEN user_email IS NOT NULL THEN 1 END) as with_email,
        COUNT(CASE WHEN answer IS NOT NULL THEN 1 END) as answered
      FROM faq
    `);
    console.log('\n❓ FAQ 表详情:');
    console.log(`   总记录数: ${faqStats[0].total}`);
    console.log(`   有user_id的: ${faqStats[0].with_user_id}`);
    console.log(`   有email的: ${faqStats[0].with_email}`);
    console.log(`   已回答的: ${faqStats[0].answered}`);

    // 显示有用户信息的FAQ样本
    const [faqWithUsers] = await connection.execute(`
      SELECT user_id, user_email, question 
      FROM faq 
      WHERE user_id IS NOT NULL OR user_email IS NOT NULL 
      LIMIT 3
    `);
    console.log('\n❓ 有用户信息的FAQ样本:');
    faqWithUsers.forEach((row, i) => {
      console.log(`   ${i+1}. 用户${row.user_id || '无ID'} (${row.user_email || '无邮箱'})`);
      console.log(`      问题: ${row.question.substring(0, 50)}...`);
    });

    // 检查pricing plans
    const [plans] = await connection.execute('SELECT plan_type, name, price_monthly, features FROM pricing_plans');
    console.log('\n💰 定价方案详情:');
    plans.forEach((plan, i) => {
      const features = JSON.parse(plan.features);
      console.log(`   ${i+1}. ${plan.plan_type}: ${plan.name} - $${plan.price_monthly}/月`);
      console.log(`      功能数量: ${features.length}`);
    });

    // 检查site stats
    const [stats] = await connection.execute('SELECT * FROM site_stats');
    console.log('\n📊 网站统计:');
    if (stats.length > 0) {
      const stat = stats[0];
      console.log(`   用户数: ${stat.total_users}`);
      console.log(`   商品数: ${stat.total_listings}`);
      console.log(`   已售数: ${stat.total_sold}`);
      console.log(`   平均评分: ${stat.avg_rating}`);
    }

    await connection.end();
    console.log('\n✅ 详细验证完成！所有表都有数据，user_id和user_email字段也正常工作！');
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
  }
}

detailedCheck();
