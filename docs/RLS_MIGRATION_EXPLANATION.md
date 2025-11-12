# RLS 迁移脚本详细解释

## 📋 概述

这个迁移脚本为 **8 张高优先级表**启用 Row-Level Security (RLS) 并添加安全策略，保护敏感用户数据。

**迁移脚本**：`20250127000002_enable_rls_high_priority_tables`

---

## 🔒 什么是 RLS (Row-Level Security)？

**RLS** 是 PostgreSQL 的行级安全功能，允许在数据库级别实施细粒度的访问控制。

### 工作原理：
1. **启用 RLS**：`ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. **创建策略**：定义谁可以访问哪些数据
3. **自动过滤**：所有查询都会自动应用策略，无需在应用层手动过滤

### 优势：
- ✅ **数据库级别安全**：即使应用层有漏洞，数据库也会保护数据
- ✅ **自动过滤**：无需在每个查询中手动添加 `WHERE user_id = ?`
- ✅ **统一管理**：所有安全规则集中在一个地方
- ✅ **性能优化**：数据库可以优化策略执行

---

## 📊 处理的 8 张表

1. **conversations** - 用户私有对话数据
2. **messages** - 用户私有消息内容
3. **notifications** - 用户私有通知数据
4. **saved_outfits** - 用户私有搭配数据
5. **user_follows** - 用户关系数据
6. **premium_subscriptions** - 用户订阅和支付信息
7. **listing_promotions** - 卖家推广数据
8. **reports** - 敏感举报数据

---

## 🔑 关键概念

### 1. `auth.uid()` 和 `auth.role()`

- **`auth.uid()`**：返回当前 Supabase 认证用户的 UUID
- **`auth.role()`**：返回当前用户的角色（`'service_role'` 用于后端服务）

### 2. 策略类型

- **`FOR SELECT`**：控制数据读取（查询）
- **`FOR INSERT`**：控制数据插入（使用 `WITH CHECK`）
- **`FOR UPDATE`**：控制数据更新（使用 `USING`）
- **`FOR DELETE`**：控制数据删除
- **`FOR ALL`**：控制所有操作

### 3. `USING` vs `WITH CHECK`

- **`USING`**：用于 SELECT、UPDATE、DELETE，检查**现有数据**是否符合条件
- **`WITH CHECK`**：用于 INSERT、UPDATE，检查**新数据**是否符合条件

---

## 📝 每张表的详细策略

### 1. conversations 表（对话表）

#### 策略 1：参与者可以查看自己的对话
```sql
FOR SELECT USING (
  auth.uid() = (SELECT supabase_user_id FROM users WHERE id = conversations.initiator_id) OR
  auth.uid() = (SELECT supabase_user_id FROM users WHERE id = conversations.participant_id)
)
```
**解释**：
- 只有对话的**发起者**或**参与者**可以查看对话
- 通过 `users.supabase_user_id` 关联 Supabase Auth 用户

#### 策略 2：发起者可以创建对话
```sql
FOR INSERT WITH CHECK (
  auth.uid() = (SELECT supabase_user_id FROM users WHERE id = conversations.initiator_id)
)
```
**解释**：
- 只有**发起者**可以创建对话
- 防止用户冒充他人创建对话

#### 策略 3：参与者可以更新对话状态
```sql
FOR UPDATE USING (
  auth.uid() = (SELECT supabase_user_id FROM users WHERE id = conversations.initiator_id) OR
  auth.uid() = (SELECT supabase_user_id FROM users WHERE id = conversations.participant_id)
)
```
**解释**：
- **发起者**或**参与者**可以更新对话状态（如标记为已读）

#### 策略 4：后端服务角色完全访问
```sql
FOR ALL USING (auth.role() = 'service_role')
```
**解释**：
- 后端服务角色（使用 `service_role`）可以绕过 RLS，完全访问数据
- 这是**必需的**，因为后端 API 需要访问所有数据

---

### 2. messages 表（消息表）

#### 策略 1：发送者和接收者可以查看消息
```sql
FOR SELECT USING (
  auth.uid() = (SELECT supabase_user_id FROM users WHERE id = messages.sender_id) OR
  auth.uid() = (SELECT supabase_user_id FROM users WHERE id = messages.receiver_id)
)
```
**解释**：
- 只有**发送者**或**接收者**可以查看消息
- 防止第三方查看私人消息

#### 策略 2：发送者可以发送消息
```sql
FOR INSERT WITH CHECK (
  auth.uid() = (SELECT supabase_user_id FROM users WHERE id = messages.sender_id)
)
```
**解释**：
- 只有**发送者**可以创建消息
- 防止用户冒充他人发送消息

#### 策略 3：接收者可以更新消息状态
```sql
FOR UPDATE USING (
  auth.uid() = (SELECT supabase_user_id FROM users WHERE id = messages.receiver_id)
)
```
**解释**：
- 只有**接收者**可以更新消息状态（如标记为已读）
- 发送者不能修改消息内容

---

### 3. notifications 表（通知表）

#### 策略 1：用户只能查看自己的通知
```sql
FOR SELECT USING (
  auth.uid() = (SELECT supabase_user_id FROM users WHERE id = notifications.user_id)
)
```
**解释**：
- 用户只能查看**自己的通知**
- 防止用户查看他人的通知

#### 策略 2：用户可以更新自己的通知
```sql
FOR UPDATE USING (
  auth.uid() = (SELECT supabase_user_id FROM users WHERE id = notifications.user_id)
)
```
**解释**：
- 用户可以更新自己的通知（如标记为已读）
- 但不能修改通知内容（由后端创建）

#### 策略 3：后端服务角色管理所有通知
```sql
FOR ALL USING (auth.role() = 'service_role')
```
**解释**：
- 后端服务角色可以**创建和管理所有通知**
- 这是必需的，因为通知是由后端系统创建的

---

### 4. saved_outfits 表（保存的搭配表）

#### 策略 1：用户只能管理自己的搭配
```sql
FOR ALL USING (
  auth.uid() = (SELECT supabase_user_id FROM users WHERE id = saved_outfits.user_id)
)
```
**解释**：
- 用户只能查看、创建、更新、删除**自己的搭配**
- `FOR ALL` 表示适用于所有操作（SELECT、INSERT、UPDATE、DELETE）

#### 策略 2：后端服务角色完全访问
```sql
FOR ALL USING (auth.role() = 'service_role')
```
**解释**：
- 后端服务角色可以访问所有搭配数据
- 用于管理功能或数据分析

---

### 5. user_follows 表（用户关注表）

#### 策略 1：公开查看关注关系
```sql
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = user_follows.follower_id
    AND (u.follows_visibility = 'PUBLIC' OR u.follows_visibility = 'FOLLOWERS_ONLY')
  )
)
```
**解释**：
- 如果用户的关注可见性设置为 `PUBLIC` 或 `FOLLOWERS_ONLY`，所有人都可以查看
- 如果设置为 `PRIVATE`，则不能查看（策略不匹配）

#### 策略 2：用户可以管理自己的关注
```sql
FOR ALL USING (
  auth.uid() = (SELECT supabase_user_id FROM users WHERE id = user_follows.follower_id)
)
```
**解释**：
- 用户只能管理**自己的关注**（关注/取消关注他人）
- 不能管理他人的关注关系

---

### 6. premium_subscriptions 表（高级订阅表）

#### 策略 1：用户只能查看自己的订阅
```sql
FOR SELECT USING (
  auth.uid() = (SELECT supabase_user_id FROM users WHERE id = premium_subscriptions.user_id)
)
```
**解释**：
- 用户只能查看**自己的订阅信息**
- 保护支付和订阅数据的隐私

#### 策略 2：后端服务角色管理所有订阅
```sql
FOR ALL USING (auth.role() = 'service_role')
```
**解释**：
- 后端服务角色可以**创建和管理所有订阅**
- 这是必需的，因为订阅是由后端系统创建的（支付处理等）

---

### 7. listing_promotions 表（商品推广表）

#### 策略 1：卖家可以管理自己的推广
```sql
FOR ALL USING (
  auth.uid() = (SELECT supabase_user_id FROM users WHERE id = listing_promotions.seller_id)
)
```
**解释**：
- 卖家只能管理**自己的推广**
- 防止卖家查看或修改他人的推广

#### 策略 2：公开查看活跃推广
```sql
FOR SELECT USING (status = 'ACTIVE' AND (ends_at IS NULL OR ends_at > NOW()))
```
**解释**：
- 所有人都可以查看**活跃的推广**（用于展示）
- 只有状态为 `ACTIVE` 且未过期的推广可以被查看
- 这是**业务需求**，因为推广需要公开显示

#### 策略 3：后端服务角色完全访问
```sql
FOR ALL USING (auth.role() = 'service_role')
```
**解释**：
- 后端服务角色可以访问所有推广数据
- 用于管理功能或数据分析

---

### 8. reports 表（举报表）

#### 策略 1：用户可以查看自己提交的举报
```sql
FOR SELECT USING (
  reporter = (SELECT email FROM users WHERE supabase_user_id = auth.uid())
)
```
**解释**：
- 用户只能查看**自己提交的举报**
- 使用 `email` 字段匹配（因为 `reports.reporter` 是字符串类型）

#### 策略 2：用户可以创建举报
```sql
FOR INSERT WITH CHECK (
  reporter = (SELECT email FROM users WHERE supabase_user_id = auth.uid()) OR
  auth.role() = 'service_role'
)
```
**解释**：
- 用户只能以**自己的邮箱**创建举报
- 后端服务角色也可以创建举报（用于系统举报）

#### 策略 3：只有管理员可以更新举报状态
```sql
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE supabase_user_id = auth.uid()
    AND role = 'ADMIN'
  )
)
```
**解释**：
- 只有**管理员**可以更新举报状态（如标记为已解决）
- 普通用户不能修改举报状态
- 使用 `EXISTS` 子查询检查用户角色

#### 策略 4：后端服务角色完全访问
```sql
FOR ALL USING (auth.role() = 'service_role')
```
**解释**：
- 后端服务角色可以访问所有举报数据
- 用于管理功能或数据分析

---

## 🔐 安全考虑

### 1. 后端服务角色

**为什么需要 `service_role`？**
- 后端 API 需要访问所有数据（管理功能、数据分析等）
- 使用 `service_role` 可以**绕过 RLS**，完全访问数据
- **重要**：`service_role` 密钥必须保密，只能在服务器端使用

### 2. 性能优化

**索引要求**：
- `users.supabase_user_id` 上必须有索引（已存在：`idx_users_supabase_user_id`）
- 策略中的子查询会频繁执行，索引可以大大提高性能

**优化建议**：
- 使用 `EXISTS` 子查询而不是 `JOIN`（对于 RLS 策略更高效）
- 避免在策略中使用复杂的函数调用
- 策略应该尽可能简单和直接

### 3. 策略优先级

**策略执行顺序**：
1. 所有策略都是 **OR** 关系
2. 如果**任何一个策略匹配**，操作就会被允许
3. 如果**所有策略都不匹配**，操作就会被拒绝

**示例**：
- 对于 `conversations` 表：
  - 如果用户是参与者 → 可以查看（策略 1）
  - 如果用户是后端服务角色 → 可以查看（策略 4）
  - 如果都不匹配 → 不能查看

### 4. 测试策略

**测试建议**：
1. ✅ 使用不同的用户角色测试策略
2. ✅ 测试边界情况（NULL 值、不存在的用户等）
3. ✅ 验证 `service_role` 可以绕过 RLS（用于后端操作）
4. ✅ 验证普通用户只能访问自己的数据
5. ✅ 验证匿名用户不能访问受保护的数据

---

## 🚀 执行迁移

### 1. 执行迁移脚本

```bash
cd web
npx prisma migrate deploy
# 或
npx prisma migrate dev
```

### 2. 验证迁移

```sql
-- 检查 RLS 是否启用
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('conversations', 'messages', 'notifications', 'saved_outfits', 'user_follows', 'premium_subscriptions', 'listing_promotions', 'reports');

-- 检查策略是否创建
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('conversations', 'messages', 'notifications', 'saved_outfits', 'user_follows', 'premium_subscriptions', 'listing_promotions', 'reports');
```

### 3. 测试策略

```sql
-- 测试用户只能查看自己的通知
-- 使用 Supabase 客户端或 Prisma 客户端测试
-- 确保普通用户只能访问自己的数据
-- 确保后端服务角色可以访问所有数据
```

---

## ⚠️ 注意事项

### 1. 幂等性

**`DROP POLICY IF EXISTS`**：
- 所有策略创建前都使用 `DROP POLICY IF EXISTS`
- 确保迁移脚本可以**重复执行**而不会报错
- 这是**最佳实践**，确保迁移脚本的幂等性

### 2. 数据访问

**应用层代码**：
- 应用层代码**不需要修改**，因为 RLS 是透明的
- 所有查询都会自动应用策略
- 但需要确保使用正确的 Supabase 客户端（带认证）

### 3. 后端访问

**后端服务角色**：
- 后端 API 必须使用 `service_role` 密钥
- 这允许后端绕过 RLS，完全访问数据
- **重要**：`service_role` 密钥必须保密，只能在服务器端使用

### 4. 性能影响

**查询性能**：
- RLS 策略会**稍微影响查询性能**
- 但对于大多数查询，影响可以忽略不计
- 如果性能有问题，可以考虑优化策略或添加索引

---

## 📚 参考资料

- [PostgreSQL RLS 文档](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase RLS 文档](https://supabase.com/docs/guides/auth/row-level-security)
- [Prisma RLS 文档](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/using-prisma-client-with-row-level-security)

---

*本解释文档生成时间：2025年1月27日*
*基于迁移脚本：`20250127000002_enable_rls_high_priority_tables`*

