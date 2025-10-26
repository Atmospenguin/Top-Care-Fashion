const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

// 测试用的认证token（需要替换为实际的token）
const AUTH_TOKEN = 'your-auth-token-here';

async function testMarkReceivedFlow() {
  try {
    console.log('🔍 Testing Mark as Received flow...\n');

    // 1. 检查订单35的当前状态
    console.log('1. Checking order 35 status...');
    const orderResponse = await axios.get(`${API_BASE_URL}/api/orders/35`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Order 35 status:', orderResponse.data.status);
    console.log('Order 35 details:', {
      id: orderResponse.data.id,
      status: orderResponse.data.status,
      buyer_id: orderResponse.data.buyer_id,
      seller_id: orderResponse.data.seller_id
    });

    // 2. 检查对话37的消息
    console.log('\n2. Checking conversation 37 messages...');
    const messagesResponse = await axios.get(`${API_BASE_URL}/api/messages/37`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Conversation messages count:', messagesResponse.data.messages?.length || 0);
    console.log('System messages:', messagesResponse.data.messages?.filter(msg => msg.type === 'system').map(msg => ({
      id: msg.id,
      text: msg.text,
      sentByUser: msg.sentByUser
    })) || []);

    // 3. 模拟 Mark as Received 操作
    console.log('\n3. Simulating Mark as Received...');
    const updateResponse = await axios.patch(`${API_BASE_URL}/api/orders/35`, {
      status: 'COMPLETED'
    }, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Order updated to:', updateResponse.data.status);

    // 4. 再次检查对话消息
    console.log('\n4. Checking conversation messages after update...');
    const updatedMessagesResponse = await axios.get(`${API_BASE_URL}/api/messages/37`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Updated conversation messages count:', updatedMessagesResponse.data.messages?.length || 0);
    console.log('Updated system messages:', updatedMessagesResponse.data.messages?.filter(msg => msg.type === 'system').map(msg => ({
      id: msg.id,
      text: msg.text,
      sentByUser: msg.sentByUser
    })) || []);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// 运行测试
testMarkReceivedFlow();
