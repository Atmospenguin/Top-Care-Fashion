# 🧪 BuyNow和Cancel功能测试指南

## 📋 测试商品列表
我为你找到了一些可以测试的商品（不包括ID 41）：
- **ID 15**: Gold Statement Necklace (BaubleBar)
- **ID 16**: Test from API 
- **ID 17**: Test from API
- **ID 12**: Designer Sunglasses (Ray-Ban)
- **ID 11**: Retro Band T-Shirt (Vintage)

## 🛒 测试BuyNow功能

### 方法1: 使用curl命令
```bash
# 替换{你的token}为实际的认证token
curl -X POST "http://192.168.0.79:3000/api/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {你的token}" \
  -d '{
    "listing_id": 15
  }'
```

### 方法2: 使用提供的测试脚本
1. 打开 `mobile/test-buynow-cancel.js`
2. 替换 `YOUR_AUTH_TOKEN_HERE` 为你的实际token
3. 在Node.js环境中运行脚本

## ❌ 测试Cancel功能

### 方法1: 使用curl命令
```bash
# 替换{订单ID}为BuyNow返回的订单ID
curl -X PATCH "http://192.168.0.79:3000/api/orders/{订单ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {你的token}" \
  -d '{
    "status": "CANCELLED"
  }'
```

## 🔍 验证结果

### 检查订单状态
```bash
curl -H "Authorization: Bearer {你的token}" \
  "http://192.168.0.79:3000/api/orders/{订单ID}"
```

### 检查商品状态
```bash
curl -H "Authorization: Bearer {你的token}" \
  "http://192.168.0.79:3000/api/listings/{商品ID}"
```

## 📱 通过移动端测试

1. **BuyNow测试**:
   - 在移动端找到商品ID 15 (Gold Statement Necklace)
   - 点击"Buy Now"按钮
   - 检查是否成功创建订单

2. **Cancel测试**:
   - 在订单列表中找到刚创建的订单
   - 点击"Cancel"按钮
   - 检查订单状态是否变为"CANCELLED"

## 🎯 预期结果

### BuyNow成功时:
- 返回状态码: 200
- 创建新订单，状态为"IN_PROGRESS"
- 商品状态可能变为"sold: true"（取决于实现）

### Cancel成功时:
- 返回状态码: 200
- 订单状态变为"CANCELLED"
- 商品状态恢复为"sold: false"

## 🚨 注意事项

1. **认证**: 确保使用有效的认证token
2. **权限**: 只能购买别人的商品，不能买自己的
3. **状态**: 只能购买未售出的商品
4. **取消**: 只有买家或卖家可以取消订单

## 🔧 故障排除

如果测试失败，检查：
1. 认证token是否有效
2. 商品是否已售出
3. 是否尝试购买自己的商品
4. API服务器是否正在运行
5. 网络连接是否正常



