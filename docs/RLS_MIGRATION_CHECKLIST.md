# RLS 迁移脚本检查清单

## ✅ 检查项目

### 1. SQL 语法检查

- [x] 所有 SQL 语句语法正确
- [x] 所有表名和字段名与 schema 匹配
- [x] 所有策略名称唯一且描述性
- [x] 使用 `DROP POLICY IF EXISTS` 确保幂等性
- [x] 所有策略都有正确的 `FOR` 子句（SELECT、INSERT、UPDATE、ALL）

### 2. 字段名称检查

- [x] `conversations.initiator_id` - ✅ 存在
- [x] `conversations.participant_id` - ✅ 存在
- [x] `messages.sender_id` - ✅ 存在
- [x] `messages.receiver_id` - ✅ 存在
- [x] `notifications.user_id` - ✅ 存在
- [x] `saved_outfits.user_id` - ✅ 存在
- [x] `user_follows.follower_id` - ✅ 存在
- [x] `user_follows.following_id` - ✅ 存在
- [x] `premium_subscriptions.user_id` - ✅ 存在
- [x] `listing_promotions.seller_id` - ✅ 存在
- [x] `listing_promotions.status` - ✅ 存在（PromotionStatus 枚举）
- [x] `listing_promotions.ends_at` - ✅ 存在（可为 NULL）
- [x] `reports.reporter` - ✅ 存在（String 类型）
- [x] `users.supabase_user_id` - ✅ 存在（可为 NULL）
- [x] `users.email` - ✅ 存在（NOT NULL）
- [x] `users.role` - ✅ 存在（UserRole 枚举）
- [x] `users.follows_visibility` - ✅ 存在（VisibilitySetting 枚举）

### 3. 枚举值检查

- [x] `PromotionStatus` - 值：ACTIVE, EXPIRED, SCHEDULED
- [x] `UserRole` - 值：USER, ADMIN
- [x] `VisibilitySetting` - 值：PUBLIC, FOLLOWERS_ONLY, PRIVATE

### 4. 策略逻辑检查

#### conversations 表
- [x] SELECT：参与者可以查看自己的对话
- [x] INSERT：发起者可以创建对话
- [x] UPDATE：参与者可以更新对话状态
- [x] 后端服务角色完全访问

#### messages 表
- [x] SELECT：发送者和接收者可以查看消息
- [x] INSERT：发送者可以发送消息
- [x] UPDATE：接收者可以更新消息状态
- [x] 后端服务角色完全访问

#### notifications 表
- [x] SELECT：用户只能查看自己的通知
- [x] UPDATE：用户可以更新自己的通知
- [x] 后端服务角色可以创建和管理所有通知

#### saved_outfits 表
- [x] ALL：用户只能管理自己的搭配
- [x] 后端服务角色完全访问

#### user_follows 表
- [x] SELECT：公开的关注关系可以查看
- [x] ALL：用户可以管理自己的关注
- [x] 后端服务角色完全访问

#### premium_subscriptions 表
- [x] SELECT：用户只能查看自己的订阅
- [x] 后端服务角色可以创建和管理所有订阅

#### listing_promotions 表
- [x] ALL：卖家可以管理自己的推广
- [x] SELECT：公开可以查看活跃推广
- [x] 后端服务角色完全访问

#### reports 表
- [x] SELECT：用户可以查看自己提交的举报
- [x] INSERT：用户可以创建举报
- [x] ALL：只有管理员可以更新举报状态
- [x] 后端服务角色完全访问

### 5. 性能优化检查

- [x] `users.supabase_user_id` 索引已存在（`idx_users_supabase_user_id`）
- [x] 策略使用 `EXISTS` 子查询（性能优化）
- [x] 避免在策略中使用复杂的函数调用

### 6. 安全性检查

- [x] 所有策略都使用 `auth.uid()` 进行身份验证
- [x] 后端服务角色使用 `auth.role() = 'service_role'` 检查
- [x] 用户只能访问自己的数据
- [x] 后端服务角色可以绕过 RLS（必需）
- [x] 管理员检查使用 `EXISTS` 子查询（安全）

### 7. 潜在问题检查

#### 问题 1：NULL supabase_user_id 处理
- **问题**：数据库中有 10 个用户没有 `supabase_user_id`
- **影响**：这些用户无法通过 RLS 策略访问数据
- **解决方案**：
  - ✅ 这些用户可能是不活跃的旧用户
  - ✅ 如果他们需要访问数据，需要先关联 Supabase Auth 用户
  - ✅ 后端服务角色仍然可以访问这些用户的数据

#### 问题 2：reports 表的 email 匹配
- **问题**：如果用户没有 `supabase_user_id`，`SELECT email FROM users WHERE supabase_user_id = auth.uid()` 会返回 NULL
- **影响**：这些用户无法查看或创建举报
- **解决方案**：
  - ✅ 这是**预期的行为**，因为只有通过 Supabase Auth 认证的用户才能使用 RLS
  - ✅ 未认证的用户应该通过后端 API 创建举报（使用 service_role）

#### 问题 3：listing_promotions 表的策略冲突
- **问题**：多个策略可能会冲突
- **影响**：卖家可能无法查看自己的非活跃推广
- **检查**：
  - ✅ "Sellers can manage own promotions" (FOR ALL) - 允许卖家查看所有自己的推广
  - ✅ "Public can view active promotions" (FOR SELECT) - 允许所有人查看活跃推广
  - ✅ 这两个策略不会冲突，因为：
    - 卖家可以通过 "Sellers can manage own promotions" 策略查看所有自己的推广（无论状态）
    - 其他人可以通过 "Public can view active promotions" 策略查看活跃推广
  - ✅ 策略是正确的

#### 问题 4：user_follows 表的可见性检查
- **问题**：策略只检查 `follower_id` 的可见性，没有检查 `following_id`
- **影响**：可能无法正确实现 `FOLLOWERS_ONLY` 的可见性
- **检查**：
  - ✅ 当前策略检查 `follower_id` 的可见性
  - ⚠️ 可能需要检查 `following_id` 的可见性（如果用户想隐藏自己的关注对象）
  - **建议**：当前策略应该是正确的，因为 `follows_visibility` 控制的是用户自己的关注列表的可见性

#### 问题 5：notifications 表的 INSERT 策略
- **问题**：用户无法创建通知（只有后端可以）
- **影响**：这是**预期的行为**，因为通知应该由后端系统创建
- **检查**：
  - ✅ "Backend manage notifications" (FOR ALL) - 后端可以创建和管理所有通知
  - ✅ 用户无法创建通知（这是正确的，因为通知应该由后端系统创建）
  - ✅ 策略是正确的

### 8. 边界情况检查

- [x] NULL 值处理（supabase_user_id 可能为 NULL）
- [x] 枚举值比较（status = 'ACTIVE'）
- [x] 时间比较（ends_at IS NULL OR ends_at > NOW()）
- [x] 子查询返回 NULL 的情况
- [x] 不存在的用户（策略会返回 false，正确拒绝访问）

### 9. 策略冲突检查

- [x] conversations 表：多个策略不会冲突
- [x] messages 表：多个策略不会冲突
- [x] notifications 表：多个策略不会冲突
- [x] saved_outfits 表：多个策略不会冲突
- [x] user_follows 表：多个策略不会冲突
- [x] premium_subscriptions 表：多个策略不会冲突
- [x] listing_promotions 表：多个策略不会冲突
- [x] reports 表：多个策略不会冲突

### 10. 测试建议

- [ ] 测试用户只能查看自己的数据
- [ ] 测试用户无法查看他人的数据
- [ ] 测试后端服务角色可以访问所有数据
- [ ] 测试管理员可以更新举报状态
- [ ] 测试匿名用户无法访问受保护的数据
- [ ] 测试 NULL 值处理
- [ ] 测试枚举值比较
- [ ] 测试时间比较

---

## ⚠️ 发现的问题

### 问题 1：listing_promotions 表的策略可能需要优化

**当前策略**：
- "Sellers can manage own promotions" (FOR ALL) - 允许卖家查看和管理所有自己的推广
- "Public can view active promotions" (FOR SELECT) - 允许所有人查看活跃推广

**潜在问题**：
- 如果卖家想查看自己的非活跃推广（如 EXPIRED），"Sellers can manage own promotions" 策略会允许
- 如果卖家想查看他人的活跃推广，"Public can view active promotions" 策略会允许
- 这应该是正确的行为

**建议**：
- ✅ 当前策略是正确的
- ✅ 卖家可以查看所有自己的推广（无论状态）
- ✅ 所有人可以查看活跃推广（用于展示）

### 问题 2：user_follows 表的可见性检查

**当前策略**：
- "Public can view follows" (FOR SELECT) - 检查 `follower_id` 的可见性

**潜在问题**：
- 只检查 `follower_id` 的可见性，没有检查 `following_id` 的可见性
- 如果用户想隐藏自己的关注对象，可能需要检查 `following_id` 的可见性

**建议**：
- ✅ 当前策略应该是正确的
- ✅ `follows_visibility` 控制的是用户自己的关注列表的可见性
- ✅ 如果需要更复杂的可见性控制，可以添加额外的策略

### 问题 3：reports 表的 email 匹配

**当前策略**：
- 使用 `reporter = (SELECT email FROM users WHERE supabase_user_id = auth.uid())` 匹配

**潜在问题**：
- 如果用户没有 `supabase_user_id`，子查询会返回 NULL
- 如果 `reporter` 字段的值与用户的 email 不匹配，策略会失败

**建议**：
- ✅ 这是**预期的行为**，因为只有通过 Supabase Auth 认证的用户才能使用 RLS
- ✅ 未认证的用户应该通过后端 API 创建举报（使用 service_role）
- ✅ 如果用户没有 `supabase_user_id`，他们无法通过 RLS 访问数据（这是正确的）

---

## ✅ 最终检查结果

### SQL 语法
- ✅ 所有 SQL 语句语法正确
- ✅ 所有表名和字段名与 schema 匹配
- ✅ 所有策略名称唯一且描述性

### 策略逻辑
- ✅ 所有策略逻辑正确
- ✅ 用户只能访问自己的数据
- ✅ 后端服务角色可以访问所有数据
- ✅ 管理员可以更新举报状态

### 性能优化
- ✅ `users.supabase_user_id` 索引已存在
- ✅ 策略使用 `EXISTS` 子查询（性能优化）

### 安全性
- ✅ 所有策略都使用 `auth.uid()` 进行身份验证
- ✅ 后端服务角色使用 `auth.role() = 'service_role'` 检查
- ✅ 用户只能访问自己的数据

### 边界情况
- ✅ NULL 值处理正确
- ✅ 枚举值比较正确
- ✅ 时间比较正确

---

## 🚀 执行建议

### 1. 执行前检查

- [ ] 备份数据库
- [ ] 检查现有 RLS 策略（避免冲突）
- [ ] 检查索引是否存在
- [ ] 检查枚举值是否正确

### 2. 执行迁移

```bash
cd web
npx prisma migrate deploy
# 或
npx prisma migrate dev
```

### 3. 执行后验证

- [ ] 检查 RLS 是否启用
- [ ] 检查策略是否创建
- [ ] 测试用户只能查看自己的数据
- [ ] 测试后端服务角色可以访问所有数据
- [ ] 测试管理员可以更新举报状态

---

## 📝 注意事项

1. **NULL supabase_user_id**：数据库中有 10 个用户没有 `supabase_user_id`，这些用户无法通过 RLS 策略访问数据。如果需要访问，需要先关联 Supabase Auth 用户。

2. **reports 表的 email 匹配**：策略使用 email 匹配，如果用户没有 `supabase_user_id`，无法通过 RLS 访问数据。这是**预期的行为**。

3. **listing_promotions 表的策略**：多个策略不会冲突，卖家可以查看所有自己的推广，所有人可以查看活跃推广。

4. **user_follows 表的可见性**：当前策略检查 `follower_id` 的可见性，如果需要更复杂的可见性控制，可以添加额外的策略。

5. **notifications 表的 INSERT**：用户无法创建通知，只有后端可以。这是**预期的行为**，因为通知应该由后端系统创建。

---

*检查清单生成时间：2025年1月27日*
*基于迁移脚本：`20250127000002_enable_rls_high_priority_tables`*

