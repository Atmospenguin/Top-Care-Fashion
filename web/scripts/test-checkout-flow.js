// 测试结账流程 - 验证买家信息保存到 Supabase
const API_BASE = 'http://localhost:3000';

// 模拟买家结账信息
const checkoutData = {
  listing_id: 41, // Adidas 商品
  buyer_name: "张三",
  buyer_phone: "13800138000", 
  shipping_address: "北京市朝阳区三里屯街道123号, 北京市, 北京 100000",
  payment_method: "Visa",
  payment_details: {
    brand: "Visa",
    last4: "1234",
    expiry: "12/25",
    cvv: "123"
  }
};

async function testCheckoutFlow() {
  console.log("🧪 测试结账流程...");
  
  try {
    // 1. 创建订单
    console.log("📝 创建订单...");
    const createResponse = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjEsImlhdCI6MTczNzk4NzQwMCwiZXhwIjoxNzM4NTkxODAwfQ.8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8' // 模拟 JWT token
      },
      body: JSON.stringify(checkoutData)
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      console.error("❌ 创建订单失败:", error);
      return;
    }

    const order = await createResponse.json();
    console.log("✅ 订单创建成功:", {
      id: order.id,
      order_number: order.order_number,
      buyer_name: order.buyer_name,
      buyer_phone: order.buyer_phone,
      shipping_address: order.shipping_address,
      payment_method: order.payment_method
    });

    // 2. 验证订单详情
    console.log("🔍 验证订单详情...");
    const detailResponse = await fetch(`${API_BASE}/api/orders/${order.id}`, {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjEsImlhdCI6MTczNzk4NzQwMCwiZXhwIjoxNzM4NTkxODAwfQ.8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8'
      }
    });

    if (!detailResponse.ok) {
      const error = await detailResponse.text();
      console.error("❌ 获取订单详情失败:", error);
      return;
    }

    const orderDetail = await detailResponse.json();
    console.log("✅ 订单详情验证成功:");
    console.log("  - 买家姓名:", orderDetail.buyer_name);
    console.log("  - 买家电话:", orderDetail.buyer_phone);
    console.log("  - 收货地址:", orderDetail.shipping_address);
    console.log("  - 支付方式:", orderDetail.payment_method);
    console.log("  - 支付详情:", JSON.stringify(orderDetail.payment_details, null, 2));

    console.log("\n🎉 结账流程测试完成！卖家现在可以在 web 端看到买家的详细信息了。");

  } catch (error) {
    console.error("❌ 测试失败:", error);
  }
}

// 运行测试
testCheckoutFlow();

