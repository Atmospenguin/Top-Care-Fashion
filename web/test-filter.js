const fetch = require('node-fetch');

async function testFilter() {
  try {
    console.log('🧪 Testing filter functionality...');
    
    // 测试获取用户分类
    console.log('\n1. Testing get user categories...');
    const categoriesResponse = await fetch('http://localhost:3000/api/listings/my/categories', {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE', // 需要替换为真实token
      }
    });
    
    if (categoriesResponse.ok) {
      const categoriesData = await categoriesResponse.json();
      console.log('✅ Categories:', categoriesData);
    } else {
      console.log('❌ Categories failed:', categoriesResponse.status);
    }
    
    // 测试filter API
    console.log('\n2. Testing filter API...');
    const filterResponse = await fetch('http://localhost:3000/api/listings/my?status=active&category=Bottoms', {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE', // 需要替换为真实token
      }
    });
    
    if (filterResponse.ok) {
      const filterData = await filterResponse.json();
      console.log('✅ Filter result:', filterData);
    } else {
      console.log('❌ Filter failed:', filterResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testFilter();

