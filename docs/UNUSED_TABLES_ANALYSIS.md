# 未使用表分析报告

## 概述

本报告分析了代码库中所有数据库表的使用情况，识别出未被使用的表。

## 分析结果

### ✅ 已使用的表（26 张）

以下表在代码中被实际使用：

1. **users** - 用户表 ✅
2. **listing_categories** - 商品分类表 ✅
3. **listings** - 商品表 ✅
4. **listing_promotions** - 商品推广表 ✅
5. **premium_subscriptions** - 高级订阅表 ✅
6. **user_addresses** - 用户地址表 ✅
7. **user_payment_methods** - 用户支付方式表 ✅
8. **cart_items** - 购物车表 ✅
9. **orders** - 订单表 ✅
10. **reviews** - 评价表 ✅
11. **feedback** - 反馈表 ✅
12. **faq** - 常见问题表 ✅
13. **landing_content** - 首页内容表 ✅
14. **site_stats** - 网站统计表 ✅
15. **pricing_plans** - 定价计划表 ✅
16. **reports** - 举报表 ✅
17. **user_follows** - 用户关注表 ✅
18. **user_likes** - 用户点赞表 ✅
19. **conversations** - 对话表 ✅
20. **messages** - 消息表 ✅
21. **notifications** - 通知表 ✅
22. **saved_outfits** - 保存的搭配表 ✅
23. **listing_clicks** - 商品点击表 ✅
24. **listing_stats_daily** - 商品每日统计表 ✅
25. **releases** - 版本发布表 ✅（通过 Supabase 直接查询，不是 Prisma）
26. **brand_mappings** - 品牌映射表 ✅（在数据库中存在，但不在 Prisma schema 中）

### ⚠️ 未使用的表（2 张）

以下表在代码中**没有被实际使用**：

#### 1. **transactions** 表 ⚠️

**状态**：已定义但未被使用

**数据库状态**：
- ✅ 数据库中有 11 条记录
- ⚠️ 所有记录的 `order_id` 都是 `null`（没有关联到 `orders` 表）
- ❌ 没有代码直接查询 `transactions` 表

**证据**：
- ❌ 没有找到任何 `prisma.transactions.` 的直接查询
- ❌ 所有 "transactions" 相关的 API 都是从 `orders` 表查询，然后映射转换的
- ✅ `reviews` 表有 `transaction_id` 字段，但**所有 reviews 的 `transaction_id` 都是 `null`**
- ✅ 所有 reviews 都使用 `order_id` 字段
- ✅ 管理面板中的 "transactions" 实际上是从 `orders` 表转换而来的

**代码位置**：
- `web/src/app/api/admin/transactions/route.ts` - 从 `orders` 表查询
- `web/src/app/api/admin/transactions/[id]/route.ts` - 从 `orders` 表查询
- `web/src/app/api/admin/users/[id]/transactions/route.ts` - 从 `orders` 表查询
- `web/src/app/api/admin/listings/[id]/transactions/route.ts` - 从 `orders` 表查询

**关系**：
- `reviews.transaction_id` - 字段存在但**没有被使用**（所有值都是 `null`）
- `reviews.order_id` - **实际使用的字段**
- `orders` 表有 `transactions[]` 关系，但没有被使用
- `listings` 表有 `transactions?` 关系，但没有被使用

**建议**：
1. ⚠️ **谨慎删除**：`transactions` 表中有 11 条旧数据，但这些数据没有关联到 `orders` 表
2. ✅ **可以安全删除**：代码已经完全迁移到使用 `orders` 表
3. ⚠️ **需要清理**：
   - 从 `reviews` 表中删除 `transaction_id` 字段（所有值都是 `null`）
   - 从 `reviews` 表中删除 `@@unique([transaction_id, reviewer_id])` 和 `@@unique([transaction_id, reviewer_type])` 约束
   - 从 Prisma schema 中删除 `transactions` 模型
   - 从 `orders` 模型中删除 `transactions[]` 关系
   - 从 `listings` 模型中删除 `transactions?` 关系
   - 从 `users` 模型中删除 `transactions_buy` 和 `transactions_sell` 关系

#### 2. **outfit_items** 表 ⚠️

**状态**：已定义但未被使用

**数据库状态**：
- ✅ 表中**没有数据**（所有 `saved_outfits` 都没有对应的 `outfit_items` 记录）
- ❌ 没有代码直接查询 `outfit_items` 表

**证据**：
- ❌ 没有找到任何 `prisma.outfit_items.` 的直接查询
- ❌ 只有 TypeScript 接口定义在 `outfits/analyze` 和 `outfits/match` 路由中（这些是 API 接口，不是数据库查询）
- ✅ `saved_outfits` 表中有数据，但 `outfit_items` 表中**没有数据**
- ✅ 所有 `saved_outfits` 都没有对应的 `outfit_items` 记录
- ✅ `saved_outfits` 表直接存储搭配信息（`base_item_id`, `top_item_id`, `bottom_item_id`, `shoe_item_id`, `accessory_ids`）

**代码位置**：
- `web/src/app/api/outfits/route.ts` - 只使用 `saved_outfits` 表
- `web/src/app/api/outfits/analyze/route.ts` - 只有 TypeScript 接口定义
- `web/src/app/api/outfits/match/route.ts` - 只有 TypeScript 接口定义

**关系**：
- `outfit_items.outfit_id` - 应该关联到 `saved_outfits.id`，但**没有数据**
- `saved_outfits` 表没有 `outfit_items[]` 关系

**建议**：
1. ✅ **可以立即删除**：`outfit_items` 表中没有数据，风险低
2. ✅ **可以安全删除**：`outfit_items` 表已经被 `saved_outfits` 表完全替代
3. ⚠️ **需要清理**：
   - 从 Prisma schema 中删除 `outfit_items` 模型
   - 删除 `outfit_items` 表的 RLS 策略（如果存在）
   - 删除迁移脚本中的 `outfit_items` 相关代码

## 详细分析

### transactions 表分析

**表结构**：
```prisma
model transactions {
  id         Int       @id @default(autoincrement())
  buyer_id   Int
  seller_id  Int
  listing_id Int       @unique
  quantity   Int       @default(1)
  price_each Decimal   @db.Decimal(10, 2)
  status     TxStatus  @default(PENDING)
  created_at DateTime  @default(now()) @db.Timestamptz(6)
  order_id   Int?
  updated_at DateTime? @default(now()) @db.Timestamptz(6)
  buyer      users     @relation("Buyer", fields: [buyer_id], references: [id])
  listing    listings  @relation(fields: [listing_id], references: [id])
  orders     orders?   @relation(fields: [order_id], references: [id], onUpdate: NoAction)
  seller     users     @relation("Seller", fields: [seller_id], references: [id])
}
```

**数据库状态**：
- ⚠️ 数据库中有 11 条记录
- ⚠️ 所有记录的 `order_id` 都是 `null`（没有关联到 `orders` 表）
- ⚠️ 这些是旧的交易记录，可能是系统迁移前的数据

**使用情况**：
- ❌ 没有直接查询
- ❌ 所有 "transactions" 功能都使用 `orders` 表
- ✅ `reviews` 表有 `transaction_id` 字段，但**所有 reviews 的 `transaction_id` 都是 `null`**
- ✅ 所有 reviews 都使用 `order_id` 字段

**替代方案**：
- ✅ `orders` 表已经包含所有必要的信息
- ✅ 管理面板中的 "transactions" 实际上是从 `orders` 表转换而来的
- ⚠️ 旧的 `transactions` 记录可能需要迁移到 `orders` 表（如果需要保留历史数据）

### outfit_items 表分析

**表结构**：
```prisma
model outfit_items {
  id         String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  outfit_id  String    @db.Uuid
  item_id    String    @db.VarChar(255)
  category   String?   @db.VarChar(50)
  item_data  Json?
  created_at DateTime? @default(now()) @db.Timestamptz(6)
}
```

**使用情况**：
- ❌ 没有直接查询
- ❌ 表中没有数据
- ✅ `saved_outfits` 表直接存储搭配信息

**替代方案**：
- ✅ `saved_outfits` 表已经包含所有必要的信息（`base_item_id`, `top_item_id`, `bottom_item_id`, `shoe_item_id`, `accessory_ids`）

## 清理建议

### 1. 删除 transactions 表

**步骤**：
1. 检查 `reviews` 表中的 `transaction_id` 字段是否还在使用
2. 如果不再使用，从 `reviews` 表中删除 `transaction_id` 字段
3. 从 Prisma schema 中删除 `transactions` 模型
4. 从 `orders` 模型中删除 `transactions[]` 关系
5. 从 `listings` 模型中删除 `transactions?` 关系
6. 从 `users` 模型中删除 `transactions_buy` 和 `transactions_sell` 关系
7. 运行 `npx prisma generate` 更新 Prisma Client
8. 创建迁移删除 `transactions` 表

**注意事项**：
- ⚠️ 检查数据库中是否有 `transactions` 表的数据
- ⚠️ 如果有数据，需要先迁移到 `orders` 表
- ⚠️ 检查是否有外键约束依赖 `transactions` 表

### 2. 删除 outfit_items 表

**步骤**：
1. 从 Prisma schema 中删除 `outfit_items` 模型
2. 删除 `outfit_items` 表的 RLS 策略（如果存在）
3. 删除迁移脚本中的 `outfit_items` 相关代码
4. 运行 `npx prisma generate` 更新 Prisma Client
5. 创建迁移删除 `outfit_items` 表

**注意事项**：
- ✅ 表中没有数据，可以安全删除
- ✅ 没有外键约束依赖 `outfit_items` 表
- ⚠️ 需要删除 RLS 策略（如果存在）

## 风险评估

### transactions 表

**风险等级**：🟡 中等

**数据库状态**：
- ⚠️ 数据库中有 11 条旧记录
- ⚠️ 所有记录的 `order_id` 都是 `null`（没有关联到 `orders` 表）
- ⚠️ 这些记录可能是系统迁移前的历史数据

**风险**：
- ⚠️ `reviews` 表有 `transaction_id` 字段，但**所有值都是 `null`**（不再使用）
- ⚠️ 有遗留的外键约束（`reviews.transaction_id` 的唯一约束）
- ⚠️ 数据库中有 11 条旧数据，可能需要迁移或删除
- ⚠️ `transactions.listing_id` 有 `UNIQUE` 约束，可能与 `orders` 表冲突

**建议**：
1. ✅ **检查数据**：数据库中是否有重要的 `transactions` 数据需要保留
2. ✅ **迁移数据**：如果需要保留历史数据，可以将旧的 `transactions` 记录迁移到 `orders` 表
3. ✅ **删除字段**：从 `reviews` 表中删除 `transaction_id` 字段（所有值都是 `null`）
4. ✅ **删除约束**：删除 `reviews` 表中的 `transaction_id` 相关唯一约束
5. ✅ **删除表**：删除 `transactions` 表和相关关系

### outfit_items 表

**风险等级**：🟢 低

**风险**：
- ✅ 表中没有数据
- ✅ 没有外键约束依赖
- ⚠️ 需要删除 RLS 策略

**建议**：
1. 可以直接删除 `outfit_items` 表
2. 删除 RLS 策略
3. 从 Prisma schema 中删除模型

## 实施计划

### 阶段 1：检查和分析

1. ✅ 检查 `transactions` 表中是否有数据
2. ✅ 检查 `reviews` 表中的 `transaction_id` 字段是否还在使用
3. ✅ 检查 `outfit_items` 表中是否有数据
4. ✅ 检查是否有外键约束依赖这些表

### 阶段 2：清理 transactions 表

1. ⏳ 检查 `reviews` 表中的 `transaction_id` 字段使用情况
2. ⏳ 如果有数据，迁移到 `orders` 表
3. ⏳ 从 Prisma schema 中删除 `transactions` 模型
4. ⏳ 从相关模型中删除关系
5. ⏳ 运行 `npx prisma generate`
6. ⏳ 创建迁移删除 `transactions` 表

### 阶段 3：清理 outfit_items 表

1. ⏳ 从 Prisma schema 中删除 `outfit_items` 模型
2. ⏳ 删除 RLS 策略
3. ⏳ 运行 `npx prisma generate`
4. ⏳ 创建迁移删除 `outfit_items` 表

## 总结

### 未使用的表（2 张）

1. **transactions** - 已被 `orders` 表替代
2. **outfit_items** - 已被 `saved_outfits` 表替代

### 已删除的表（1 张）

1. **order_items** - 已被 `orders` 表替代 ✅（已删除）

### 建议

1. ✅ **立即删除** `outfit_items` 表（没有数据，风险低）
2. ⚠️ **谨慎删除** `transactions` 表（需要先检查数据和依赖）
3. ✅ **继续使用** 其他 26 张表

---

*本报告生成时间：2025年1月27日*
*基于代码库分析和数据库查询结果*

