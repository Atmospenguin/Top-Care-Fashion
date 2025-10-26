/**
 * 测试支付系统前后端集成
 * 
 * 使用方法：
 * 1. 确保后端服务器运行（web 目录：npm run dev）
 * 2. 在 mobile 目录运行：node test-payment-integration.js
 * 3. 替换 YOUR_AUTH_TOKEN 为真实的 JWT token
 */

const API_BASE_URL = 'http://localhost:3000';
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN'; // 替换为真实 token

async function testPaymentAPI() {
  console.log('🧪 开始测试支付系统 API...\n');

  // 测试 1: 获取支付方式列表
  console.log('📝 测试 1: GET /api/payment-methods');
  try {
    const res1 = await fetch(`${API_BASE_URL}/api/payment-methods`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    const data1 = await res1.json();
    console.log('✅ 获取支付方式列表成功');
    console.log('   支付方式数量:', data1.paymentMethods?.length || 0);
    console.log('   数据:', JSON.stringify(data1, null, 2));
  } catch (err) {
    console.error('❌ 测试失败:', err.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // 测试 2: 创建新支付方式
  console.log('📝 测试 2: POST /api/payment-methods');
  const newCard = {
    type: 'card',
    label: 'Test Visa Card',
    brand: 'Visa',
    last4: '4242',
    expiryMonth: 12,
    expiryYear: 2025,
  };
  
  try {
    const res2 = await fetch(`${API_BASE_URL}/api/payment-methods`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newCard)
    });
    const data2 = await res2.json();
    console.log('✅ 创建支付方式成功');
    console.log('   新卡片 ID:', data2.paymentMethod?.id);
    console.log('   数据:', JSON.stringify(data2, null, 2));
    
    // 测试 3: 更新支付方式为默认
    if (data2.paymentMethod?.id) {
      console.log('\n' + '='.repeat(60) + '\n');
      console.log('📝 测试 3: PUT /api/payment-methods (设为默认)');
      
      const res3 = await fetch(`${API_BASE_URL}/api/payment-methods`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentMethodId: data2.paymentMethod.id,
          isDefault: true
        })
      });
      const data3 = await res3.json();
      console.log('✅ 设置默认支付方式成功');
      console.log('   数据:', JSON.stringify(data3, null, 2));
      
      // 测试 4: 删除支付方式
      console.log('\n' + '='.repeat(60) + '\n');
      console.log('📝 测试 4: DELETE /api/payment-methods');
      
      const res4 = await fetch(
        `${API_BASE_URL}/api/payment-methods?paymentMethodId=${data2.paymentMethod.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`
          }
        }
      );
      
      if (res4.ok) {
        console.log('✅ 删除支付方式成功');
      } else {
        const err4 = await res4.json();
        console.error('❌ 删除失败:', err4);
      }
    }
  } catch (err) {
    console.error('❌ 测试失败:', err.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');
  console.log('🎉 测试完成！');
}

// 运行测试
testPaymentAPI();
