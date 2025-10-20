// 测试 API 连接
const API_URL = 'https://top-care-fashion.vercel.app';

async function testAPI() {
  try {
    console.log('Testing API connection...');
    
    // 测试 listings API
    const response = await fetch(`${API_URL}/api/listings`);
    const data = await response.json();
    
    console.log('✅ API 连接成功！');
    console.log('返回的商品数量:', data.items?.length || 0);
    console.log('第一个商品:', data.items?.[0]?.title || '无数据');
    
    return true;
  } catch (error) {
    console.error('❌ API 连接失败:', error.message);
    return false;
  }
}

testAPI();


