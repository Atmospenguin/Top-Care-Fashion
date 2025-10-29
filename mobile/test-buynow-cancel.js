// 测试BuyNow和Cancel功能的脚本
// 使用方法：在Node.js环境中运行

const API_BASE_URL = 'http://192.168.0.79:3000';

// 你需要先获取你的认证token
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN_HERE'; // 替换为你的实际token

// 测试用的商品ID（不是41）
const TEST_LISTING_ID = 15; // Gold Statement Necklace

async function testBuyNowAndCancel() {
  try {
    console.log('🧪 开始测试BuyNow和Cancel功能...');
    
    // 1. 测试BuyNow - 创建订单
    console.log(`\n🛒 测试BuyNow - 购买商品ID: ${TEST_LISTING_ID}`);
    
    const buyNowResponse = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        listing_id: TEST_LISTING_ID
      })
    });
    
    if (!buyNowResponse.ok) {
      const errorText = await buyNowResponse.text();
      console.log(`❌ BuyNow失败: ${buyNowResponse.status} - ${errorText}`);
      return;
    }
    
    const orderData = await buyNowResponse.json();
    console.log('✅ BuyNow成功! 订单创建:', orderData);
    
    const orderId = orderData.order?.id;
    if (!orderId) {
      console.log('❌ 没有获取到订单ID');
      return;
    }
    
    // 2. 测试Cancel - 取消订单
    console.log(`\n❌ 测试Cancel - 取消订单ID: ${orderId}`);
    
    const cancelResponse = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'CANCELLED'
      })
    });
    
    if (!cancelResponse.ok) {
      const errorText = await cancelResponse.text();
      console.log(`❌ Cancel失败: ${cancelResponse.status} - ${errorText}`);
      return;
    }
    
    const cancelData = await cancelResponse.json();
    console.log('✅ Cancel成功! 订单已取消:', cancelData);
    
    // 3. 验证商品状态是否恢复
    console.log(`\n🔍 验证商品状态 - 检查商品ID: ${TEST_LISTING_ID}`);
    
    const listingResponse = await fetch(`${API_BASE_URL}/api/listings/${TEST_LISTING_ID}`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (listingResponse.ok) {
      const listingData = await listingResponse.json();
      console.log('📋 商品当前状态:', {
        id: listingData.listing?.id,
        name: listingData.listing?.title,
        sold: listingData.listing?.sold,
        listed: listingData.listing?.listed
      });
    }
    
    console.log('\n🎉 测试完成! BuyNow和Cancel功能都正常工作!');
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
  }
}

// 运行测试
testBuyNowAndCancel();



