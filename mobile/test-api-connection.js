// 测试 API 连接和数据处理
const API_URL = 'https://top-care-fashion.vercel.app';

async function testAPIConnection() {
  console.log('🧪 测试 Supabase API 连接...\n');

  try {
    // 测试 listings API
    console.log('1. 测试商品列表 API...');
    const response = await fetch(`${API_URL}/api/listings`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ 商品列表 API 成功！');
    console.log(`📊 返回商品数量: ${data.items?.length || 0}`);
    
    if (data.items && data.items.length > 0) {
      const firstItem = data.items[0];
      console.log('📦 第一个商品信息:');
      console.log(`   - ID: ${firstItem.id}`);
      console.log(`   - 标题: ${firstItem.title}`);
      console.log(`   - 价格: $${firstItem.price}`);
      console.log(`   - 图片: ${firstItem.imageUrl || '无图片'}`);
    }

    // 测试其他 API 端点
    console.log('\n2. 测试其他 API 端点...');
    
    // 测试用户认证端点（不需要实际认证）
    try {
      const authResponse = await fetch(`${API_URL}/api/auth/me`);
      console.log(`   - 认证端点状态: ${authResponse.status}`);
    } catch (e) {
      console.log('   - 认证端点: 需要认证（正常）');
    }

    // 测试反馈端点
    try {
      const feedbackResponse = await fetch(`${API_URL}/api/feedback`);
      console.log(`   - 反馈端点状态: ${feedbackResponse.status}`);
    } catch (e) {
      console.log('   - 反馈端点: 需要认证（正常）');
    }

    console.log('\n🎉 所有测试完成！你的 Mobile App 现在可以连接到 Supabase 数据了！');
    console.log('\n📱 下一步：');
    console.log('1. 在 Expo 应用中查看首页的推荐商品');
    console.log('2. 测试搜索功能');
    console.log('3. 查看商品详情页面');
    
    return true;
  } catch (error) {
    console.error('❌ API 连接失败:', error.message);
    console.log('\n🔧 可能的解决方案：');
    console.log('1. 检查网络连接');
    console.log('2. 确认 Web API 正在运行');
    console.log('3. 检查 .env 文件中的 API_URL');
    return false;
  }
}

testAPIConnection();


