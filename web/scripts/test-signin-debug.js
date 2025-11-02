// 快速测试登录API并查看详细错误
// 运行方式: node scripts/test-signin-debug.js

// 使用动态导入支持不同Node版本
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testSignin() {
  console.log('🧪 Testing Signin API at http://192.168.0.80:3000/api/auth/signin\n');
  
  // 使用一个测试邮箱和密码
  const testData = {
    email: 'cathy@example.com',  // 根据你的实际测试账号修改
    password: 'Password123!'
  };
  
  console.log(`📧 Testing with email: ${testData.email}\n`);
  
  try {
    const response = await fetch('http://192.168.0.80:3000/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📊 Headers:`, Object.fromEntries(response.headers.entries()));
    console.log(`📊 Response:`, JSON.stringify(responseData, null, 2));
    
    if (response.status === 500) {
      console.log('\n❌ 500错误 - 服务器内部错误');
      console.log('请检查web服务器运行的终端窗口，查看详细的错误日志');
      console.log('错误通常会在终端中显示为:');
      console.log('  ❌ Signin API - Error details: ...');
      console.log('  ❌ Signin API - Error stack: ...');
    } else if (response.status === 401) {
      console.log('\n⚠️ 401错误 - 认证失败（用户名或密码错误）');
    } else if (response.ok) {
      console.log('\n✅ 登录成功！');
    }
    
  } catch (error) {
    console.error('\n❌ 网络错误:', error.message);
    console.error('请确保:');
    console.error('  1. Web服务器正在运行 (npm run dev)');
    console.error('  2. 服务器地址正确 (http://192.168.0.80:3000)');
  }
}

testSignin().catch(console.error);
