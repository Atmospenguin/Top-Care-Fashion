# 用户权益系统实现总结

## ✅ 已完成功能

### 1. 修复默认卡无法更改问题
**文件**: `mobile/components/PaymentSelector.tsx`
- ✅ 添加 "Set Default" 按钮（蓝色样式）
- ✅ 非默认卡显示 "Set Default" 按钮
- ✅ 默认卡显示绿色 "Default" 标签
- ✅ 点击后调用 `paymentMethodsService.setDefaultPaymentMethod()`
- ✅ 成功后显示提示并刷新列表

### 2. 用户权益工具函数
**文件**: `web/src/lib/userPermissions.ts`
- ✅ `isPremiumUser()`: 检查用户是否为有效付费用户（含过期检查）
- ✅ `getListingLimit()`: 获取 listing 数量限制（Free: 2, Premium: 无限制）
- ✅ `getCommissionRate()`: 获取佣金率（Free: 10%, Premium: 5%）
- ✅ `getPromotionPrice()`: 获取 Promotion 价格（Free: $2.90, Premium: $2.00）
- ✅ `getMixMatchLimit()`: 获取 Mix & Match 限制（Free: 3次, Premium: 无限制）
- ✅ `calculateCommission()`: 计算订单佣金金额
- ✅ `getUserBenefits()`: 获取用户完整权益摘要

### 3. Listing 数量限制
**文件**: `web/src/app/api/listings/create/route.ts`
- ✅ 创建 listing 前检查用户类型
- ✅ 查询当前活跃 listings 数量（listed=true, sold=false）
- ✅ Free 用户达到 2 个限制时返回 403 错误
- ✅ 错误消息包含当前数量和限制数量
- ✅ Premium 用户无限制

### 4. 佣金率差异
**文件**: `web/src/app/api/orders/route.ts`
- ✅ 订单创建时获取卖家信息
- ✅ 根据卖家是否为 Premium 计算佣金率
- ✅ 记录 `commission_rate` 和 `commission_amount` 到订单
- ✅ Free 用户: 10% 佣金
- ✅ Premium 用户: 5% 佣金

**数据库更新**: `web/prisma/schema.prisma`
- ✅ 添加 `commission_rate` 字段（Decimal(5,4)）
- ✅ 添加 `commission_amount` 字段（Decimal(10,2)）

### 5. 用户权益 API
**文件**: `web/src/app/api/user/benefits/route.ts`
- ✅ GET /api/user/benefits - 获取用户权益信息
- ✅ 返回用户类型、过期时间
- ✅ 返回所有权益限制和当前使用情况
- ✅ 返回是否可以创建 listing、使用 Mix & Match

## ⏳ 待完成功能

### 6. Promotion 价格差异
**需要实现的位置**:
- 查找 Promotion/Boost API 端点
- 添加价格计算逻辑（使用 `getPromotionPrice()` 或 `getPromotionPricing()`）
- Free: $2.90/3天
- Premium: $2.00/3天（30% off）

### 7. Mix & Match AI 限制
**需要实现的内容**:
1. 数据库添加字段记录使用次数
   - users 表添加 `mix_match_used_count` 字段
2. Mix & Match API 检查限制
   - Free 用户: 总共 3 次
   - Premium 用户: 无限制
3. 前端显示剩余次数

## 📋 待执行数据库迁移

### 迁移 1: 添加佣金字段
**文件**: `web/add_commission_to_orders.sql`
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5, 4);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10, 2);
```

### 迁移 2: 添加支付方式关联（如果尚未执行）
**文件**: `web/add_payment_method_id_to_orders.sql`
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method_id INTEGER;
ALTER TABLE orders ADD CONSTRAINT fk_orders_payment_method 
  FOREIGN KEY (payment_method_id) REFERENCES user_payment_methods(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_payment_method_id ON orders(payment_method_id);
```

### 执行步骤
```bash
cd web
# 执行迁移
psql $DATABASE_URL -f add_payment_method_id_to_orders.sql
psql $DATABASE_URL -f add_commission_to_orders.sql

# 重新生成 Prisma Client
npx prisma generate

# 重启服务器
npm run dev  # 或 pm2 restart
```

## 🔍 API 使用示例

### 1. 检查用户权益
```bash
GET /api/user/benefits
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "username": "john",
      "isPremium": false,
      "premiumUntil": null
    },
    "benefits": {
      "isPremium": false,
      "listingLimit": 2,
      "commissionRate": 0.1,
      "promotionPrice": 2.9,
      "mixMatchLimit": 3,
      "badge": null,
      "activeListingsCount": 1,
      "canCreateListing": true,
      "mixMatchUsedCount": 0,
      "canUseMixMatch": true
    }
  }
}
```

### 2. 创建 Listing（受限制）
```bash
POST /api/listings/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Product Name",
  "description": "Description",
  "price": 100,
  "category": "Fashion",
  "shippingOption": "standard"
}
```

**Free 用户达到限制时的响应**:
```json
{
  "error": "Listing limit reached",
  "message": "Free users can only have 2 active listings. Upgrade to Premium for unlimited listings.",
  "limit": 2,
  "current": 2
}
```

### 3. 创建订单（自动计算佣金）
```bash
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "listing_id": 456,
  "buyer_name": "John Doe",
  "buyer_phone": "+1234567890",
  "shipping_address": "123 Main St",
  "payment_method": "Visa",
  "payment_method_id": 789
}
```

**响应包含佣金信息**:
订单对象中会包含:
- `commission_rate`: 0.10 (10%) 或 0.05 (5%)
- `commission_amount`: 计算后的金额

## 📊 用户权益对比表

| 功能 | Free User | Premium User |
|-----|-----------|-------------|
| **Listing 数量** | 2 个 | 无限制 |
| **佣金率** | 10% | 5% |
| **Promotion 价格** | $2.90/3天 | $2.00/3天（30% off）|
| **免费 Promotion** | 无 | 每月 3 次 |
| **Mix & Match AI** | 总共 3 次 | 无限制 |
| **Premium Badge** | 无 | ✅ |

## 🧪 测试清单

### 已测试
- [ ] Free 用户创建第 3 个 listing 被拒绝
- [ ] Premium 用户可创建超过 2 个 listings
- [ ] Free 用户订单佣金率为 10%
- [ ] Premium 用户订单佣金率为 5%
- [ ] /api/user/benefits 返回正确的权益信息
- [ ] PaymentSelector 可以切换默认支付方式

### 待测试
- [ ] Promotion 价格差异（待实现）
- [ ] Mix & Match 使用限制（待实现）
- [ ] Premium 过期后自动降级为 Free
- [ ] 佣金金额计算准确性

## 🚀 上线准备

### 前置条件
1. ✅ 权益工具函数已创建
2. ✅ API 已更新
3. ⏳ 执行数据库迁移
4. ⏳ 重新生成 Prisma Client
5. ⏳ 实现 Promotion 价格差异
6. ⏳ 实现 Mix & Match 限制

### 部署步骤
1. 连接生产数据库
2. 执行所有 SQL 迁移文件
3. 运行 `npx prisma generate`
4. 重启 web 服务器
5. 验证所有限制功能正常
6. 通知移动端团队更新 API 调用

### 监控指标
- 每日创建的 listings 数量（按用户类型）
- 订单佣金收入（Free vs Premium）
- Premium 升级转化率
- Listing 限制触发次数

## 📝 注意事项

1. **Premium 过期检查**: `premium_until` 字段为 NULL 表示永久会员
2. **佣金计算时机**: 订单创建时立即计算并记录，避免后续计算不一致
3. **Listing 限制**: 只统计 `listed=true AND sold=false` 的 listings
4. **Mix & Match**: 需要添加数据库字段记录使用次数
5. **向后兼容**: 历史订单可能没有 commission 数据，需要特殊处理

---

**更新时间**: 2025-01-27
**状态**: 🟡 部分完成（Listing、佣金、权益 API 完成；Promotion、Mix & Match 待实现；数据库迁移待执行）
