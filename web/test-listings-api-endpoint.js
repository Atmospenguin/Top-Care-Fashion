// 测试 listings API
async function testListingsAPI() {
  try {
    console.log('🚀 Testing listings API...');
    
    const response = await fetch('http://localhost:3001/api/listings');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ API Response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testListingsAPI();
