// 测试登录 API
// 运行方式: node test-login.js

require('dotenv').config();

async function testLogin() {
  console.log('🧪 Testing Login API...\n');
  
  const API_URL = 'http://localhost:3001';
  
  // 测试数据
  const testCredentials = [
    { email: 'test@example.com', password: 'password123' },
    { email: 'admin@example.com', password: 'admin123' },
    { email: 'user@example.com', password: 'user123' }
  ];
  
  for (const cred of testCredentials) {
    try {
      console.log(`🔍 Testing login with: ${cred.email}`);
      
      const response = await fetch(`${API_URL}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cred)
      });
      
      const data = await response.json();
      
      console.log(`   Status: ${response.status}`);
      if (response.ok) {
        console.log(`   ✅ Success: ${data.user?.username}`);
      } else {
        console.log(`   ❌ Error: ${data.error}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Network Error: ${error.message}`);
    }
    console.log('');
  }
  
  // 测试 /api/auth/me
  console.log('🔍 Testing /api/auth/me...');
  try {
    const response = await fetch(`${API_URL}/api/auth/me`);
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   User: ${data.user ? data.user.username : 'null'}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

// 运行测试
testLogin().then(() => {
  console.log('\n✅ Login test completed!');
}).catch((error) => {
  console.error('❌ Test failed:', error);
});
