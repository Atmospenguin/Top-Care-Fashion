# Row-Level Security (RLS) 建议文档

## 概述

本文档提供了 Top Care Fashion 数据库的行级安全 (RLS) 实施建议。RLS 是 PostgreSQL 的安全功能，允许在数据库级别实施细粒度的访问控制。

## 当前 RLS 状态

### 已启用 RLS 的表 (17 张)

1. **users** - 用户表
   - 策略：认证用户可以读取自己的用户行

2. **cart_items** - 购物车表
   - 策略：用户可以管理自己的购物车

3. **listings** - 商品表
   - 策略：
     - 卖家可以管理自己的商品
     - 匿名用户可以查看活跃商品
     - 认证用户可以查看活跃商品
     - 后端服务角色有完全访问权限

4. **orders** - 订单表
   - 策略：用户可以查看自己的订单（作为买家或卖家）

5. **reviews** - 评价表
   - 策略：
     - 公开读取
     - 评价者可以更新自己的评价
     - 后端服务角色有完全访问权限

6. **transactions** - 交易表
   - 策略：
     - 用户可以查看自己的交易
     - 后端服务角色有完全访问权限

7. **user_addresses** - 用户地址表
   - 策略：用户可以管理自己的地址

8. **user_likes** - 用户点赞表
   - 策略：
     - 用户可以查看自己的点赞
     - 用户可以插入自己的点赞
     - 用户可以删除自己的点赞

9. **user_payment_methods** - 用户支付方式表
   - 策略：用户可以管理自己的支付方式

10. **conversations** - 对话表 ✅ (2025-01-27)
    - 策略：
      - 参与者可以查看自己的对话
      - 发起者可以创建对话
      - 参与者可以更新对话状态
      - 后端服务角色有完全访问权限

11. **messages** - 消息表 ✅ (2025-01-27)
    - 策略：
      - 发送者和接收者可以查看消息
      - 发送者可以发送消息
      - 接收者可以更新消息状态（标记为已读）
      - 后端服务角色有完全访问权限

12. **notifications** - 通知表 ✅ (2025-01-27)
    - 策略：
      - 用户只能查看自己的通知
      - 用户可以更新自己的通知（标记为已读）
      - 后端服务角色可以创建和管理所有通知

13. **saved_outfits** - 保存的搭配表 ✅ (2025-01-27)
    - 策略：
      - 用户只能查看和管理自己的搭配
      - 后端服务角色有完全访问权限

14. **user_follows** - 用户关注表 ✅ (2025-01-27)
    - 策略：
      - 所有人可以查看公开的关注关系
      - 用户可以管理自己的关注
      - 后端服务角色有完全访问权限

15. **premium_subscriptions** - 高级订阅表 ✅ (2025-01-27)
    - 策略：
      - 用户只能查看自己的订阅
      - 后端服务角色可以创建和管理所有订阅

16. **listing_promotions** - 商品推广表 ✅ (2025-01-27)
    - 策略：
      - 卖家可以查看和管理自己的推广
      - 所有人可以查看活跃的推广（用于展示）
      - 后端服务角色有完全访问权限

17. **reports** - 举报表 ✅ (2025-01-27)
    - 策略：
      - 用户可以查看自己提交的举报
      - 用户可以创建举报
      - 只有管理员可以更新举报状态
      - 后端服务角色有完全访问权限

### 未启用 RLS 但建议启用的表

根据 Supabase 安全建议，以下表应该启用 RLS：

#### 高优先级（包含敏感用户数据）✅ **已完成** (2025-01-27)

1. **conversations** - 对话表 ✅
   - **原因**：包含用户私有对话数据
   - **策略**：参与者可以查看和管理自己的对话
   - **状态**：✅ 已启用 RLS (迁移脚本：`20250127000002_enable_rls_high_priority_tables`)

2. **messages** - 消息表 ✅
   - **原因**：包含用户私有消息内容
   - **策略**：发送者和接收者可以查看自己的消息
   - **状态**：✅ 已启用 RLS (迁移脚本：`20250127000002_enable_rls_high_priority_tables`)

3. **notifications** - 通知表 ✅
   - **原因**：包含用户私有通知数据
   - **策略**：用户只能查看自己的通知
   - **状态**：✅ 已启用 RLS (迁移脚本：`20250127000002_enable_rls_high_priority_tables`)

4. **saved_outfits** - 保存的搭配表 ✅
   - **原因**：包含用户私有搭配数据
   - **策略**：用户只能查看和管理自己的搭配
   - **状态**：✅ 已启用 RLS (迁移脚本：`20250127000002_enable_rls_high_priority_tables`)

5. **user_follows** - 用户关注表 ✅
   - **原因**：包含用户关系数据
   - **策略**：用户可以查看公开的关注关系，只能管理自己的关注
   - **状态**：✅ 已启用 RLS (迁移脚本：`20250127000002_enable_rls_high_priority_tables`)

6. **premium_subscriptions** - 高级订阅表 ✅
   - **原因**：包含用户订阅和支付信息
   - **策略**：用户只能查看自己的订阅
   - **状态**：✅ 已启用 RLS (迁移脚本：`20250127000002_enable_rls_high_priority_tables`)

7. **listing_promotions** - 商品推广表 ✅
   - **原因**：包含卖家推广数据和支付信息
   - **策略**：卖家可以查看和管理自己的推广
   - **状态**：✅ 已启用 RLS (迁移脚本：`20250127000002_enable_rls_high_priority_tables`)

8. **reports** - 举报表 ✅
   - **原因**：包含敏感举报数据
   - **策略**：用户只能查看自己提交的举报，管理员可以查看所有举报
   - **状态**：✅ 已启用 RLS (迁移脚本：`20250127000002_enable_rls_high_priority_tables`)

#### 中优先级（公共数据，但需要写入保护）

10. **listing_categories** - 商品分类表
    - **原因**：公共数据，但应该限制写入
    - **建议**：所有人可以读取，只有管理员可以写入

11. **faq** - 常见问题表
    - **原因**：公共数据，但应该限制写入
    - **建议**：所有人可以读取公开的 FAQ，用户可以创建自己的 FAQ，管理员可以管理所有 FAQ

12. **feedback** - 反馈表
    - **原因**：公共数据，但应该限制写入
    - **建议**：所有人可以读取公开的反馈，用户可以创建反馈，管理员可以管理所有反馈

13. **pricing_plans** - 定价计划表
    - **原因**：公共数据，但应该限制写入
    - **建议**：所有人可以读取，只有管理员可以写入

14. **site_stats** - 网站统计表
    - **原因**：公共数据，但应该限制写入
    - **建议**：所有人可以读取，只有后端服务角色可以写入

15. **landing_content** - 首页内容表
    - **原因**：公共数据，但应该限制写入
    - **建议**：所有人可以读取，只有管理员可以写入

16. **releases** - 版本发布表
    - **原因**：公共数据，但应该限制写入
    - **建议**：所有人可以读取，只有管理员可以写入

17. **listing_stats_daily** - 商品每日统计表
    - **原因**：统计数据，应该限制写入
    - **建议**：所有人可以读取，只有后端服务角色可以写入

#### 低优先级（系统表或映射表）

18. **brand_mappings** - 品牌映射表
    - **原因**：公共映射数据
    - **建议**：所有人可以读取，只有后端服务角色可以写入

---

## RLS 策略建议

### 高优先级 RLS 修复（8 张表）

以下 8 张表包含敏感用户数据，**需要立即启用 RLS**：

1. **conversations** - 对话表
2. **messages** - 消息表
3. **notifications** - 通知表
4. **saved_outfits** - 保存的搭配表
5. **user_follows** - 用户关注表
6. **premium_subscriptions** - 高级订阅表
7. **listing_promotions** - 商品推广表
8. **reports** - 举报表

### 1. conversations 表（高优先级）⚠️

**当前状态**：未启用 RLS

**建议策略**：

```sql
-- 启用 RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- 参与者可以查看自己的对话
DROP POLICY IF EXISTS "Participants can view own conversations" ON public.conversations;
CREATE POLICY "Participants can view own conversations" ON public.conversations
  FOR SELECT USING (
    auth.uid() = (SELECT supabase_user_id FROM users WHERE id = conversations.initiator_id) OR
    auth.uid() = (SELECT supabase_user_id FROM users WHERE id = conversations.participant_id)
  );

-- 发起者可以创建对话
DROP POLICY IF EXISTS "Initiators can create conversations" ON public.conversations;
CREATE POLICY "Initiators can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT supabase_user_id FROM users WHERE id = conversations.initiator_id)
  );

-- 参与者可以更新对话状态
DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;
CREATE POLICY "Participants can update conversations" ON public.conversations
  FOR UPDATE USING (
    auth.uid() = (SELECT supabase_user_id FROM users WHERE id = conversations.initiator_id) OR
    auth.uid() = (SELECT supabase_user_id FROM users WHERE id = conversations.participant_id)
  );

-- 后端服务角色有完全访问权限
DROP POLICY IF EXISTS "Backend full access conversations" ON public.conversations;
CREATE POLICY "Backend full access conversations" ON public.conversations
  FOR ALL USING (auth.role() = 'service_role');
```

### 2. messages 表（高优先级）⚠️

**当前状态**：未启用 RLS

**建议策略**：

```sql
-- 启用 RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 发送者和接收者可以查看消息
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT USING (
    auth.uid() = (SELECT supabase_user_id FROM users WHERE id = messages.sender_id) OR
    auth.uid() = (SELECT supabase_user_id FROM users WHERE id = messages.receiver_id)
  );

-- 发送者可以发送消息
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT supabase_user_id FROM users WHERE id = messages.sender_id)
  );

-- 接收者可以更新消息状态（标记为已读）
DROP POLICY IF EXISTS "Users can update received messages" ON public.messages;
CREATE POLICY "Users can update received messages" ON public.messages
  FOR UPDATE USING (
    auth.uid() = (SELECT supabase_user_id FROM users WHERE id = messages.receiver_id)
  );

-- 后端服务角色有完全访问权限
DROP POLICY IF EXISTS "Backend full access messages" ON public.messages;
CREATE POLICY "Backend full access messages" ON public.messages
  FOR ALL USING (auth.role() = 'service_role');
```

### 3. notifications 表（高优先级）⚠️

**当前状态**：未启用 RLS

**建议策略**：

```sql
-- 启用 RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的通知
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (
    auth.uid() = (SELECT supabase_user_id FROM users WHERE id = notifications.user_id)
  );

-- 用户可以更新自己的通知（标记为已读）
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (
    auth.uid() = (SELECT supabase_user_id FROM users WHERE id = notifications.user_id)
  );

-- 后端服务角色可以创建和管理所有通知
DROP POLICY IF EXISTS "Backend manage notifications" ON public.notifications;
CREATE POLICY "Backend manage notifications" ON public.notifications
  FOR ALL USING (auth.role() = 'service_role');
```

### 4. saved_outfits 表（高优先级）⚠️

**当前状态**：未启用 RLS

**建议策略**：

```sql
-- 启用 RLS
ALTER TABLE public.saved_outfits ENABLE ROW LEVEL SECURITY;

-- 用户只能查看和管理自己的搭配
DROP POLICY IF EXISTS "Users can manage own outfits" ON public.saved_outfits;
CREATE POLICY "Users can manage own outfits" ON public.saved_outfits
  FOR ALL USING (
    auth.uid() = (SELECT supabase_user_id FROM users WHERE id = saved_outfits.user_id)
  );

-- 后端服务角色有完全访问权限
DROP POLICY IF EXISTS "Backend full access saved outfits" ON public.saved_outfits;
CREATE POLICY "Backend full access saved outfits" ON public.saved_outfits
  FOR ALL USING (auth.role() = 'service_role');
```

### 5. user_follows 表（高优先级）⚠️

**当前状态**：未启用 RLS

**建议策略**：

```sql
-- 启用 RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- 所有人可以查看公开的关注关系
DROP POLICY IF EXISTS "Public can view follows" ON public.user_follows;
CREATE POLICY "Public can view follows" ON public.user_follows
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_follows.follower_id
      AND (u.follows_visibility = 'PUBLIC' OR u.follows_visibility = 'FOLLOWERS_ONLY')
    )
  );

-- 用户可以管理自己的关注
DROP POLICY IF EXISTS "Users can manage own follows" ON public.user_follows;
CREATE POLICY "Users can manage own follows" ON public.user_follows
  FOR ALL USING (
    auth.uid() = (SELECT supabase_user_id FROM users WHERE id = user_follows.follower_id)
  );

-- 后端服务角色有完全访问权限
DROP POLICY IF EXISTS "Backend full access user follows" ON public.user_follows;
CREATE POLICY "Backend full access user follows" ON public.user_follows
  FOR ALL USING (auth.role() = 'service_role');
```

### 6. premium_subscriptions 表（高优先级）⚠️

**当前状态**：未启用 RLS

**建议策略**：

```sql
-- 启用 RLS
ALTER TABLE public.premium_subscriptions ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的订阅
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.premium_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.premium_subscriptions
  FOR SELECT USING (
    auth.uid() = (SELECT supabase_user_id FROM users WHERE id = premium_subscriptions.user_id)
  );

-- 后端服务角色可以创建和管理所有订阅
DROP POLICY IF EXISTS "Backend manage subscriptions" ON public.premium_subscriptions;
CREATE POLICY "Backend manage subscriptions" ON public.premium_subscriptions
  FOR ALL USING (auth.role() = 'service_role');
```

### 7. listing_promotions 表（高优先级）⚠️

**当前状态**：未启用 RLS

**建议策略**：

```sql
-- 启用 RLS
ALTER TABLE public.listing_promotions ENABLE ROW LEVEL SECURITY;

-- 卖家可以查看和管理自己的推广
DROP POLICY IF EXISTS "Sellers can manage own promotions" ON public.listing_promotions;
CREATE POLICY "Sellers can manage own promotions" ON public.listing_promotions
  FOR ALL USING (
    auth.uid() = (SELECT supabase_user_id FROM users WHERE id = listing_promotions.seller_id)
  );

-- 所有人可以查看活跃的推广（用于展示）
DROP POLICY IF EXISTS "Public can view active promotions" ON public.listing_promotions;
CREATE POLICY "Public can view active promotions" ON public.listing_promotions
  FOR SELECT USING (status = 'ACTIVE' AND (ends_at IS NULL OR ends_at > NOW()));

-- 后端服务角色有完全访问权限
DROP POLICY IF EXISTS "Backend full access promotions" ON public.listing_promotions;
CREATE POLICY "Backend full access promotions" ON public.listing_promotions
  FOR ALL USING (auth.role() = 'service_role');
```

### 9. listing_clicks 表（中优先级）

**建议策略**：

```sql
-- 启用 RLS
ALTER TABLE public.listing_clicks ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的点击记录（可选，如果需要）
CREATE POLICY "Users can view own clicks" ON public.listing_clicks
  FOR SELECT USING (
    user_id IS NULL OR
    auth.uid() = (SELECT supabase_user_id FROM users WHERE id = listing_clicks.user_id)
  );

-- 后端服务角色可以创建点击记录
CREATE POLICY "Backend can insert clicks" ON public.listing_clicks
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- 后端服务角色有完全访问权限
CREATE POLICY "Backend full access clicks" ON public.listing_clicks
  FOR ALL USING (auth.role() = 'service_role');
```

### 8. reports 表（高优先级）⚠️

**当前状态**：未启用 RLS

**建议策略**：

```sql
-- 启用 RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己提交的举报
DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT USING (
    reporter = (SELECT email FROM users WHERE supabase_user_id = auth.uid())
  );

-- 用户可以创建举报
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT WITH CHECK (
    reporter = (SELECT email FROM users WHERE supabase_user_id = auth.uid()) OR
    auth.role() = 'service_role'
  );

-- 只有管理员可以更新举报状态
DROP POLICY IF EXISTS "Admins can manage reports" ON public.reports;
CREATE POLICY "Admins can manage reports" ON public.reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE supabase_user_id = auth.uid()
      AND role = 'ADMIN'
    )
  );

-- 后端服务角色有完全访问权限
DROP POLICY IF EXISTS "Backend full access reports" ON public.reports;
CREATE POLICY "Backend full access reports" ON public.reports
  FOR ALL USING (auth.role() = 'service_role');
```

### 11. 公共数据表（读取公开，写入受限）

#### listing_categories 表

```sql
-- 启用 RLS
ALTER TABLE public.listing_categories ENABLE ROW LEVEL SECURITY;

-- 所有人可以读取激活的分类
CREATE POLICY "Public can read active categories" ON public.listing_categories
  FOR SELECT USING (is_active = true AND is_public = true);

-- 只有管理员可以管理分类
CREATE POLICY "Admins can manage categories" ON public.listing_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE supabase_user_id = auth.uid()
      AND role = 'ADMIN'
    )
  );

-- 后端服务角色有完全访问权限
CREATE POLICY "Backend full access categories" ON public.listing_categories
  FOR ALL USING (auth.role() = 'service_role');
```

#### faq 表

```sql
-- 启用 RLS
ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;

-- 所有人可以读取公开的 FAQ
CREATE POLICY "Public can read public faq" ON public.faq
  FOR SELECT USING (is_public = true);

-- 用户可以创建自己的 FAQ
CREATE POLICY "Users can create faq" ON public.faq
  FOR INSERT WITH CHECK (
    user_id IS NULL OR
    auth.uid() = (SELECT supabase_user_id FROM users WHERE id = faq.user_id)
  );

-- 管理员可以管理所有 FAQ
CREATE POLICY "Admins can manage faq" ON public.faq
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE supabase_user_id = auth.uid()
      AND role = 'ADMIN'
    )
  );

-- 后端服务角色有完全访问权限
CREATE POLICY "Backend full access faq" ON public.faq
  FOR ALL USING (auth.role() = 'service_role');
```

#### feedback 表

```sql
-- 启用 RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- 所有人可以读取公开的反馈
CREATE POLICY "Public can read public feedback" ON public.feedback
  FOR SELECT USING (is_public = true);

-- 用户可以创建反馈
CREATE POLICY "Users can create feedback" ON public.feedback
  FOR INSERT WITH CHECK (
    user_id IS NULL OR
    auth.uid() = (SELECT supabase_user_id FROM users WHERE id = feedback.user_id)
  );

-- 管理员可以管理所有反馈
CREATE POLICY "Admins can manage feedback" ON public.feedback
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE supabase_user_id = auth.uid()
      AND role = 'ADMIN'
    )
  );

-- 后端服务角色有完全访问权限
CREATE POLICY "Backend full access feedback" ON public.feedback
  FOR ALL USING (auth.role() = 'service_role');
```

#### pricing_plans 表

```sql
-- 启用 RLS
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

-- 所有人可以读取激活的定价计划
CREATE POLICY "Public can read active plans" ON public.pricing_plans
  FOR SELECT USING (active = true);

-- 只有管理员可以管理定价计划
CREATE POLICY "Admins can manage plans" ON public.pricing_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE supabase_user_id = auth.uid()
      AND role = 'ADMIN'
    )
  );

-- 后端服务角色有完全访问权限
CREATE POLICY "Backend full access plans" ON public.pricing_plans
  FOR ALL USING (auth.role() = 'service_role');
```

#### site_stats 表

```sql
-- 启用 RLS
ALTER TABLE public.site_stats ENABLE ROW LEVEL SECURITY;

-- 所有人可以读取统计数据
CREATE POLICY "Public can read stats" ON public.site_stats
  FOR SELECT USING (true);

-- 只有后端服务角色可以更新统计数据
CREATE POLICY "Backend can update stats" ON public.site_stats
  FOR ALL USING (auth.role() = 'service_role');
```

#### landing_content 表

```sql
-- 启用 RLS
ALTER TABLE public.landing_content ENABLE ROW LEVEL SECURITY;

-- 所有人可以读取首页内容
CREATE POLICY "Public can read landing content" ON public.landing_content
  FOR SELECT USING (true);

-- 只有管理员可以更新首页内容
CREATE POLICY "Admins can update landing content" ON public.landing_content
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE supabase_user_id = auth.uid()
      AND role = 'ADMIN'
    )
  );

-- 后端服务角色有完全访问权限
CREATE POLICY "Backend full access landing content" ON public.landing_content
  FOR ALL USING (auth.role() = 'service_role');
```

#### releases 表

```sql
-- 启用 RLS
ALTER TABLE public.releases ENABLE ROW LEVEL SECURITY;

-- 所有人可以读取版本发布
CREATE POLICY "Public can read releases" ON public.releases
  FOR SELECT USING (true);

-- 只有管理员可以管理版本发布
CREATE POLICY "Admins can manage releases" ON public.releases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE supabase_user_id = auth.uid()
      AND role = 'ADMIN'
    )
  );

-- 后端服务角色有完全访问权限
CREATE POLICY "Backend full access releases" ON public.releases
  FOR ALL USING (auth.role() = 'service_role');
```

#### listing_stats_daily 表

```sql
-- 启用 RLS
ALTER TABLE public.listing_stats_daily ENABLE ROW LEVEL SECURITY;

-- 所有人可以读取统计数据
CREATE POLICY "Public can read stats" ON public.listing_stats_daily
  FOR SELECT USING (true);

-- 只有后端服务角色可以更新统计数据
CREATE POLICY "Backend can update stats" ON public.listing_stats_daily
  FOR ALL USING (auth.role() = 'service_role');
```

#### brand_mappings 表

```sql
-- 启用 RLS
ALTER TABLE public.brand_mappings ENABLE ROW LEVEL SECURITY;

-- 所有人可以读取品牌映射
CREATE POLICY "Public can read brand mappings" ON public.brand_mappings
  FOR SELECT USING (true);

-- 只有后端服务角色可以管理品牌映射
CREATE POLICY "Backend can manage brand mappings" ON public.brand_mappings
  FOR ALL USING (auth.role() = 'service_role');
```

---

## RLS 实施优先级

### 高优先级 ✅ **已完成** (2025-01-27)

以下 8 张表已成功启用 RLS：

1. ✅ **conversations** - 用户私有对话数据
2. ✅ **messages** - 用户私有消息数据
3. ✅ **notifications** - 用户私有通知数据
4. ✅ **saved_outfits** - 用户私有搭配数据
5. ✅ **user_follows** - 用户关系数据
6. ✅ **premium_subscriptions** - 用户订阅和支付信息
7. ✅ **listing_promotions** - 卖家推广数据
8. ✅ **reports** - 敏感举报数据

**迁移脚本**：`20250127000002_enable_rls_high_priority_tables` ✅ **已执行**

### 中优先级（1个月内实施）

10. **listing_clicks** - 用户行为数据
11. **listing_categories** - 公共数据，写入保护
12. **faq** - 公共数据，写入保护
13. **feedback** - 公共数据，写入保护
14. **pricing_plans** - 公共数据，写入保护
15. **site_stats** - 统计数据，写入保护
16. **landing_content** - 内容数据，写入保护
17. **releases** - 版本数据，写入保护
18. **listing_stats_daily** - 统计数据，写入保护
19. **brand_mappings** - 映射数据，写入保护

---

## RLS 策略最佳实践

### 1. 使用 Supabase Auth

- 使用 `auth.uid()` 获取当前用户 ID
- 使用 `auth.role()` 检查用户角色（'service_role' 用于后端）
- 通过 `users.supabase_user_id` 关联 Supabase Auth 用户

### 2. 策略类型

- **SELECT 策略**：控制数据读取
- **INSERT 策略**：控制数据插入（使用 `WITH CHECK`）
- **UPDATE 策略**：控制数据更新
- **DELETE 策略**：控制数据删除
- **ALL 策略**：控制所有操作

### 3. 性能优化

- 在 `users.supabase_user_id` 上创建索引（已存在：`idx_users_supabase_user_id`）
- 使用 `EXISTS` 子查询而不是 JOIN（对于 RLS 策略更高效）
- 避免在策略中使用复杂的函数调用

### 4. 测试策略

- 使用不同的用户角色测试策略
- 测试边界情况（NULL 值、不存在的用户等）
- 验证 service_role 可以绕过 RLS（用于后端操作）

### 5. 策略命名约定

- 使用描述性的策略名称
- 遵循模式：`"[角色] can [操作] [资源]"`
- 例如：`"Users can manage own addresses"`

---

## 当前策略状态

### 1. 高优先级表 RLS 已启用 ✅ (2025-01-27)

**状态**：以下 8 张表已成功启用 RLS 并添加策略：
- ✅ `conversations` - 用户私有对话数据
- ✅ `messages` - 用户私有消息数据
- ✅ `notifications` - 用户私有通知数据
- ✅ `saved_outfits` - 用户私有搭配数据
- ✅ `user_follows` - 用户关系数据
- ✅ `premium_subscriptions` - 用户订阅和支付信息
- ✅ `listing_promotions` - 卖家推广数据
- ✅ `reports` - 敏感举报数据

**迁移脚本**：`20250127000002_enable_rls_high_priority_tables` ✅ **已执行**

**策略详情**：参见 [RLS 迁移脚本解释文档](RLS_MIGRATION_EXPLANATION.md)

### 2. 视图使用 SECURITY DEFINER

**问题**：以下视图使用 `SECURITY DEFINER`，可能存在安全风险：
- `listing_recommendations_with_boost`
- `listing_card_v`

**建议**：
- 审查这些视图的用途
- 考虑使用 `SECURITY INVOKER` 或添加适当的 RLS 策略
- 确保视图不会绕过 RLS 保护

### 3. 函数缺少 search_path 设置

**问题**：多个函数缺少 `search_path` 设置，可能导致安全风险。

**建议**：
- 为所有函数添加 `SET search_path = public` 或明确的 search_path
- 防止 SQL 注入攻击

---

## 实施步骤

### 步骤 1：修复高优先级问题 ✅ **已完成** (2025-01-27)

1. ✅ 为高优先级 8 张表启用 RLS 并添加策略（迁移脚本已创建）
   - 迁移脚本：`20250127000002_enable_rls_high_priority_tables`
   - 包含表：`conversations`, `messages`, `notifications`, `saved_outfits`, `user_follows`, `premium_subscriptions`, `listing_promotions`, `reports`
2. ✅ 执行迁移脚本启用 RLS
   - 迁移脚本已执行，所有表已启用 RLS
3. ⏳ 测试所有 RLS 策略是否正常工作
   - 验证用户只能访问自己的数据
   - 验证后端服务角色可以正常访问（绕过 RLS）
   - **建议**：在生产环境部署前进行全面测试

### 步骤 2：实施中优先级策略（1个月内）

1. 按照优先级顺序为每个表启用 RLS
2. 添加相应的策略
3. 测试每个策略
4. 更新应用程序代码以处理 RLS 限制

### 步骤 3：实施中优先级策略

1. 为公共数据表添加读取策略
2. 添加写入保护策略
3. 测试策略

### 步骤 4：审查和优化

1. 审查所有 RLS 策略
2. 优化策略性能
3. 添加必要的索引
4. 文档化所有策略

---

## 测试建议

### 1. 单元测试

为每个 RLS 策略创建测试：
- 测试用户是否可以访问自己的数据
- 测试用户是否无法访问他人的数据
- 测试匿名用户的访问权限
- 测试管理员和服务角色的访问权限

### 2. 集成测试

测试应用程序在不同 RLS 策略下的行为：
- 测试 API 端点
- 测试前端功能
- 测试移动应用功能

### 3. 性能测试

- 测试 RLS 策略对查询性能的影响
- 优化慢查询
- 添加必要的索引

---

## 监控和维护

### 1. 监控 RLS 策略

- 监控策略的执行情况
- 检查是否有策略被频繁触发
- 识别性能瓶颈

### 2. 定期审查

- 定期审查 RLS 策略
- 更新策略以适应业务需求变化
- 移除不再需要的策略

### 3. 安全审计

- 定期进行安全审计
- 检查是否有数据泄露风险
- 验证策略是否按预期工作

---

## 相关资源

- [Supabase RLS 文档](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [PostgreSQL RLS 文档](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [RLS 策略最佳实践](https://supabase.com/docs/guides/database/postgres/row-level-security#policies)

---

## 迁移脚本

创建迁移脚本来实施 RLS 策略：

```bash
# 创建新的迁移
cd web
npx prisma migrate dev --name add_rls_policies --create-only

# 编辑迁移文件，添加 RLS 策略 SQL
# 然后应用迁移
npx prisma migrate deploy
```

---

*本文档最后更新：2025年1月*
*基于 Supabase 安全建议和数据库当前状态*

