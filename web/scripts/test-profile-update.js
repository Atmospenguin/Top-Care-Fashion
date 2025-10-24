// 测试资料更新 API
// 运行方式: node test-profile-update.js

require('dotenv').config();

async function testProfileUpdate() {
  console.log('🧪 Testing Profile Update API...\n');
  
  const API_URL = 'http://localhost:3001';
  
  // 测试数据
  const testData = {
    username: "Melisa",
    email: "2563714217@qq.com",
    phone: "1234567890",
    bio: "Test bio",
    location: "Test location",
    dob: "2004-02-21",
    gender: "Female"
  };
  
  try {
    console.log('🔍 Testing profile update with:', JSON.stringify(testData, null, 2));
    
    const response = await fetch(`${API_URL}/api/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        // 这里需要添加认证头，但我们先测试数据格式
      },
      body: JSON.stringify(testData)
    });
    
    const data = await response.json();
    
    console.log(`   Status: ${response.status}`);
    if (response.ok) {
      console.log(`   ✅ Success: ${JSON.stringify(data, null, 2)}`);
    } else {
      console.log(`   ❌ Error: ${data.error}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Network Error: ${error.message}`);
  }
}

// 运行测试
testProfileUpdate().then(() => {
  console.log('\n✅ Profile update test completed!');
}).catch((error) => {
  console.error('❌ Test failed:', error);
});
