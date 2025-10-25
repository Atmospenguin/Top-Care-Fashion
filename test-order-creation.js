// 测试订单创建功能
const API_BASE = 'http://localhost:3000';

// 测试数据
const testOrderData = {
  listing_id: 41, // Adidas 商品
  buyer_name: "Mia Chen",
  buyer_phone: "+65 9123 4567",
  shipping_address: "101 West Coast Vale, Singapore, Singapore 128101",
  payment_method: "Visa",
  payment_details: {
    brand: "Visa",
    last4: "1234",
    expiry: "12/25",
    cvv: "123"
  }
};

async function testOrderCreation() {
  console.log("🧪 测试订单创建...");
  console.log("📝 测试数据:", testOrderData);
  
  try {
    // 使用一个有效的 JWT token (Cindy 用户的 token)
    const response = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjMzLCJpYXQiOjE3NTc0OTY1MjEsImV4cCI6MjA3MzA3MjUyMX0.example'
      },
      body: JSON.stringify(testOrderData)
    });

    console.log("📊 响应状态:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ 创建订单失败:", errorText);
      return;
    }

    const order = await response.json();
    console.log("✅ 订单创建成功:", {
      id: order.id,
      order_number: order.order_number,
      buyer_name: order.buyer_name,
      buyer_phone: order.buyer_phone,
      shipping_address: order.shipping_address,
      payment_method: order.payment_method,
      status: order.status
    });

    // 验证买家信息是否正确保存
    if (order.buyer_name === testOrderData.buyer_name &&
        order.buyer_phone === testOrderData.buyer_phone &&
        order.shipping_address === testOrderData.shipping_address) {
      console.log("✅ 买家信息已成功保存到订单中！");
    } else {
      console.warn("⚠️ 买家信息可能不完整或不匹配");
    }

  } catch (error) {
    console.error("❌ 测试失败:", error);
  }
}

// 运行测试
testOrderCreation();
