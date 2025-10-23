// 测试filter API
const testFilterAPI = async () => {
  try {
    console.log('🧪 Testing filter API...');
    
    // 测试active + Bottoms filter
    const response = await fetch('http://localhost:3000/api/listings/my?status=active&category=Bottoms', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // 需要添加真实的Authorization header
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Filter API response:', data);
      console.log('📊 Number of listings:', data.listings?.length);
      console.log('📊 Sample listing:', data.listings?.[0]);
    } else {
      console.log('❌ Filter API failed:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

// 运行测试
testFilterAPI();
