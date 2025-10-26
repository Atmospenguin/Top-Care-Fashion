# 支付系统快速验证指南

## 🚀 快速开始

### 1. 数据库迁移（必需）

连接到生产数据库，执行以下 SQL：

```bash
cd web
psql $DATABASE_URL -f add_payment_method_id_to_orders.sql
```

或者在 Supabase SQL Editor 中直接执行 `add_payment_method_id_to_orders.sql` 文件内容。

### 2. 重新生成 Prisma Client

```bash
cd web
npx prisma generate
```

如果遇到权限错误，可能需要关闭开发服务器后再运行。

### 3. 启动开发服务器

```bash
cd web
npm run dev
```

### 4. 测试后端 API（可选）

```bash
cd mobile
# 修改 test-payment-integration.js 中的 AUTH_TOKEN
node test-payment-integration.js
```

### 5. 运行移动端

```bash
cd mobile
npm start
```

## 📱 移动端测试步骤

### 测试 1: 添加支付方式
1. 打开 app，登录账号
2. 进入 **My TOP** → **Settings** → **Payment methods**
3. 点击 **Add New Card**
4. 填写表单：
   - Card Nickname: "My Test Card"
   - Brand: Visa
   - Last 4 digits: 4242
   - Expiry: 12/25
   - CVV: 123
5. 点击 **Save**
6. ✅ 验证：卡片出现在列表中，显示 "Default" 标签

### 测试 2: Checkout 流程
1. 浏览 **Shop** 页面，选择商品
2. 点击 **BUY NOW**
3. 进入 **Checkout** 页面
4. ✅ 验证：Payment 区域显示 "Visa ending in 4242"
5. 点击 Payment 的 **Change** 按钮
6. ✅ 验证：弹出 PaymentSelector，显示已保存的卡片
7. 选择一张卡或添加新卡
8. 点击 **Place order**
9. ✅ 验证：订单创建成功，后端 console 显示 payment_method_id

### 测试 3: Premium 升级
1. 进入 **Premium Plans** 页面
2. ✅ 验证：页面加载时自动显示默认支付方式
3. 选择订阅计划，点击 **GET IT NOW**
4. ✅ 验证：弹出支付模态框，显示 PaymentSelector
5. 选择支付方式
6. ✅ 验证：未选择时 "Confirm & Pay" 按钮禁用
7. 点击 **Confirm & Pay**
8. ✅ 验证：升级成功

### 测试 4: 管理支付方式
1. 进入 **Settings** → **Payment methods**
2. ✅ 验证：显示所有已保存的卡片
3. 点击某张卡
4. ✅ 验证：卡片边框变蓝，右上角显示对勾
5. 点击非默认卡的 **Set as Default**
6. ✅ 验证：该卡显示 "Default" 标签
7. 点击删除按钮
8. ✅ 验证：弹出确认弹窗
9. 确认删除
10. ✅ 验证：卡片从列表中移除

## 🔍 后端验证

### 检查数据库表

```sql
-- 查看 user_payment_methods 表
SELECT * FROM user_payment_methods WHERE user_id = YOUR_USER_ID;

-- 查看 orders 表的 payment_method_id
SELECT id, order_number, payment_method, payment_method_id, created_at 
FROM orders 
WHERE buyer_id = YOUR_USER_ID 
ORDER BY created_at DESC 
LIMIT 5;

-- 验证外键关系
SELECT 
  o.id AS order_id,
  o.order_number,
  o.payment_method_id,
  pm.label AS payment_method_label,
  pm.brand,
  pm.last4
FROM orders o
LEFT JOIN user_payment_methods pm ON o.payment_method_id = pm.id
WHERE o.buyer_id = YOUR_USER_ID
ORDER BY o.created_at DESC
LIMIT 5;
```

### 检查 API 日志

在后端控制台查找以下日志：

```
🔍 Orders API - Creating order with data:
  ...
  payment_method_id: 123
  ...
```

## 🐛 常见问题

### Q: Prisma generate 失败 "EPERM: operation not permitted"
**A**: 关闭开发服务器，然后再运行 `npx prisma generate`

### Q: 移动端显示 "Failed to load payment methods"
**A**: 检查：
1. 后端服务器是否运行
2. API_BASE_URL 是否正确
3. 用户是否已登录（token 是否有效）

### Q: 下单时未传递 payment_method_id
**A**: 检查：
1. CheckoutScreen 的 `selectedPaymentMethodId` 是否有值
2. 后端 API 是否接受 payment_method_id 参数
3. Prisma schema 是否已更新并生成

### Q: 数据库迁移失败
**A**: 可以手动在 Supabase SQL Editor 中执行 SQL，或者使用 `psql` 命令行工具

## 📊 性能监控

### 关键指标
- **API 响应时间**: GET /api/payment-methods 应 < 500ms
- **创建支付方式**: POST /api/payment-methods 应 < 1s
- **删除支付方式**: DELETE /api/payment-methods 应 < 500ms

### 数据库索引
已创建索引：
- `idx_orders_payment_method_id` on `orders(payment_method_id)`

## 🔒 安全提示

1. **不存储完整卡号**: 仅保存 last4 和 expiry
2. **不存储 CVV**: CVV 仅用于前端验证
3. **级联删除**: 删除用户时自动删除其所有支付方式
4. **软删除订单关联**: 删除支付方式时，订单的 payment_method_id 设为 NULL

## 📚 相关文档

- [完整集成文档](./PAYMENT_SYSTEM_INTEGRATION.md)
- [API 使用指南](../API%20Usage%20Guide.md)
- [Plans & Pricing](./Plans%20&%20Pricing.md)

---

**更新日期**: 2025-01-27
