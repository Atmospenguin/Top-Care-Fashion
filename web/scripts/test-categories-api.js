// 测试分类 API
async function testCategoriesAPI() {
  try {
    console.log('🚀 Testing categories API...');
    
    const response = await fetch('http://localhost:3001/api/categories');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ API Response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCategoriesAPI();
