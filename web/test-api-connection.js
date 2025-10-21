// 测试 API 连接和端点
// 运行方式: node test-api-connection.js

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

async function testApiConnection() {
  console.log('🧪 Testing API Connection...\n');
  console.log(`API Base URL: ${API_BASE_URL}\n`);

  const endpoints = [
    '/api/profile',
    '/api/profile/avatar',
    '/api/profile/avatar-base64',
    '/api/auth/me',
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testing ${endpoint}...`);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`   Status: ${response.status}`);
      console.log(`   Headers:`, Object.fromEntries(response.headers.entries()));
      
      if (response.status === 401) {
        console.log(`   ✅ Endpoint exists (401 Unauthorized is expected)`);
      } else if (response.status === 405) {
        console.log(`   ⚠️ Method not allowed (405)`);
      } else {
        console.log(`   📝 Response:`, await response.text().catch(() => 'No response body'));
      }
      
    } catch (error) {
      console.log(`   ❌ Error:`, error.message);
    }
    console.log('');
  }

  // 测试 POST 方法
  console.log('🔍 Testing POST methods...\n');
  
  const postEndpoints = [
    '/api/profile/avatar',
    '/api/profile/avatar-base64',
  ];

  for (const endpoint of postEndpoints) {
    try {
      console.log(`🔍 Testing POST ${endpoint}...`);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'data' }),
      });
      
      console.log(`   Status: ${response.status}`);
      
      if (response.status === 401) {
        console.log(`   ✅ POST method exists (401 Unauthorized is expected)`);
      } else if (response.status === 400) {
        console.log(`   ✅ POST method exists (400 Bad Request is expected)`);
      } else if (response.status === 405) {
        console.log(`   ❌ POST method not allowed (405)`);
      } else {
        console.log(`   📝 Response:`, await response.text().catch(() => 'No response body'));
      }
      
    } catch (error) {
      console.log(`   ❌ Error:`, error.message);
    }
    console.log('');
  }
}

// 运行测试
testApiConnection().then(() => {
  console.log('✅ API connection test completed!');
  console.log('\n📝 Summary:');
  console.log('- 401 Unauthorized = Endpoint exists, needs authentication');
  console.log('- 400 Bad Request = Endpoint exists, invalid data');
  console.log('- 405 Method Not Allowed = Endpoint exists but method not supported');
  console.log('- Connection Error = Server not running or wrong URL');
}).catch((error) => {
  console.error('❌ Test failed:', error);
});
