# 数据库 Triggers 和 Functions 清理报告

## 📊 执行摘要

通过 Supabase MCP 检查数据库和代码分析，发现以下可清理项：

### ✅ 正在使用的 Functions（保留）
1. **get_feed_v2** - 正在使用（`web/src/app/api/feed/home/route.ts`）
2. **send_welcome_message** - 触发器函数，正在使用
3. **recompute_user_rating** - 被触发器使用
4. **update_site_stats** - 被触发器使用
5. **update_updated_at_column** - 被多个触发器使用
6. **calculate_promotion_uplift** - 被触发器使用
7. **normalize_json_tags_to_lower** - 被触发器使用
8. **sync_gender_enum** - 被触发器使用
9. **set_listing_click_bucket_10s** - 被触发器使用
10. **trg_reviews_after_insert/update/delete** - 触发器函数，正在使用
11. **trg_reviews_before_insert** - 触发器函数，正在使用
12. **trg_tx_after_insert/update** - 触发器函数，正在使用
13. **trg_listings_clicks_inc/dec** - 触发器函数，正在使用

### ⚠️ 可能未使用的 Functions（已确认可以删除）

**验证结果**：
- ✅ 没有视图依赖这些函数
- ✅ 没有物化视图依赖这些函数
- ✅ 代码中只使用 `get_feed_v2`，不使用旧版本函数
- ✅ 函数之间的依赖链：`get_home_feed_v2` → `get_home_feed` → `get_more_by_tag_name`, `get_more_from_brand`

#### 1. 旧版 Feed 函数（已被 get_feed_v2 替代）- **可安全删除**
- **get_home_feed** - 旧版本，仅被 `get_home_feed_v2` 调用，而 `get_home_feed_v2` 未被使用
- **get_home_feed_v2** - 代码中使用的是 `get_feed_v2`，不是这个，可删除
- **get_trending_fast** - 未在代码中找到使用，可删除
- **get_trending_main** - 未在代码中找到使用，可删除
- **get_trending_main_fair** - 未在代码或视图中使用，可删除

#### 2. 辅助函数（可安全删除）
- **get_more_by_tag_name** - 仅被 `get_home_feed` 调用，可删除
- **get_more_from_brand** - 仅被 `get_home_feed` 调用，可删除
- **get_listing_gender** - 未在代码中找到使用，可删除
- **get_also_clicked** - 未在代码中找到使用，可删除
- **record_click_10s** - 未在代码中找到使用（点击记录通过API直接插入），可删除
- **try_jsonb** - 未在代码中找到使用，可删除
- **jsonb_text_array** - 未在代码中找到使用，可删除
- **norm_gender** - 仅被 `get_home_feed_v2` 调用，可删除
- **to_gender_enum** - 未在代码中找到使用，可删除

### 🔄 重复的 Welcome Trigger 文件

在 `web/supabase/` 目录下发现多个版本的 welcome trigger 文件：

1. **welcome_message_trigger.sql** - 初始版本（硬编码 ID=1）
2. **simple_welcome_trigger.sql** - 简化版本（函数名：create_welcome_conversation）
3. **fixed_welcome_trigger.sql** - 修复版本（动态查找 TOP Support）
4. **final_welcome_trigger.sql** - 最终版本（硬编码 ID=1）
5. **update_welcome_trigger_use_id59.sql** - 使用 ID 59 的版本（动态查找）
6. **test_final_welcome_trigger.sql** - 测试版本
7. **test_welcome_message.sql** - 另一个测试版本

**数据库实际使用**：`send_welcome_message()` 函数（动态查找 TOP Support）

**建议**：只保留 `final_welcome_trigger.sql` 或创建一个统一的版本，删除其他测试/旧版本文件。

## 🗑️ 清理建议

### 阶段 1：删除重复的 Welcome Trigger 文件

可以安全删除的文件：
- `welcome_message_trigger.sql` (旧版本)
- `simple_welcome_trigger.sql` (旧版本)
- `fixed_welcome_trigger.sql` (已被 final 版本替代)
- `update_welcome_trigger_use_id59.sql` (特定环境的版本，应该用动态查找)
- `test_final_welcome_trigger.sql` (测试文件)
- `test_welcome_message.sql` (测试文件)

保留：
- `final_welcome_trigger.sql` - 但需要确认它是否与数据库中的实际函数匹配

### 阶段 2：删除未使用的 Functions（需要谨慎）

在删除前，需要：
1. 确认这些函数没有被其他数据库对象（视图、其他函数）依赖
2. 确认这些函数没有在 Supabase Edge Functions 或其他地方使用
3. 备份数据库

可以尝试删除的函数（按优先级）：

**推荐删除顺序**（按照依赖关系，先删调用者，再删被调用者）：

```sql
-- ============================================================
-- 第一步：删除调用其他函数的函数（先删除调用者）
-- ============================================================

-- 删除 get_home_feed_v2（它调用 get_home_feed 和 norm_gender）
DROP FUNCTION IF EXISTS public.get_home_feed_v2(
    p_supabase_user_id uuid, 
    p_listing_id integer, 
    p_limit integer, 
    p_trending_limit integer, 
    p_seed integer, 
    p_offset integer, 
    p_tag text
);

-- 删除 get_home_feed（它调用 get_more_by_tag_name 和 get_more_from_brand）
DROP FUNCTION IF EXISTS public.get_home_feed(
    p_listing_id integer, 
    p_limit integer, 
    p_tag text, 
    p_trending_limit integer, 
    p_seed integer, 
    p_offset integer, 
    p_gender text
);

-- ============================================================
-- 第二步：删除被其他函数调用的函数（调用者已删除，现在可以安全删除）
-- ============================================================

-- 删除被 get_home_feed 调用的函数
DROP FUNCTION IF EXISTS public.get_more_by_tag_name(p_tag text, p_limit integer);
DROP FUNCTION IF EXISTS public.get_more_from_brand(p_listing_id integer, p_limit integer);

-- 删除被 get_home_feed_v2 调用的函数
DROP FUNCTION IF EXISTS public.norm_gender(p text);

-- ============================================================
-- 第三步：删除独立的、未被其他函数调用的函数
-- ============================================================

DROP FUNCTION IF EXISTS public.get_trending_fast(p_limit integer);
DROP FUNCTION IF EXISTS public.get_trending_main(p_limit integer);
DROP FUNCTION IF EXISTS public.get_trending_main_fair(p_limit integer);
DROP FUNCTION IF EXISTS public.get_listing_gender(p_listing_id integer);
DROP FUNCTION IF EXISTS public.get_also_clicked(p_listing_id integer, p_limit integer);
DROP FUNCTION IF EXISTS public.record_click_10s(p_listing_id integer, p_user_id integer);
DROP FUNCTION IF EXISTS public.try_jsonb(p_text text);
DROP FUNCTION IF EXISTS public.jsonb_text_array(j jsonb);
DROP FUNCTION IF EXISTS public.to_gender_enum(p text);
```

## 🔍 验证步骤

在删除任何函数之前，执行以下检查：

```sql
-- 1. 检查函数依赖关系
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'get_home_feed',
    'get_home_feed_v2',
    'get_trending_fast',
    'get_trending_main',
    'get_trending_main_fair'
  );

-- 2. 检查视图是否依赖这些函数
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views
WHERE schemaname = 'public'
  AND definition LIKE '%get_%feed%'
   OR definition LIKE '%get_trending%';

-- 3. 检查其他函数是否调用这些函数
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    pg_get_functiondef(p.oid) LIKE '%get_home_feed%'
    OR pg_get_functiondef(p.oid) LIKE '%get_trending%'
    OR pg_get_functiondef(p.oid) LIKE '%get_more_by_tag_name%'
    OR pg_get_functiondef(p.oid) LIKE '%get_more_from_brand%'
  );
```

## 📝 建议的操作顺序

1. **首先清理文件**：删除重复的 welcome trigger SQL 文件
2. **然后验证函数依赖**：执行上述 SQL 查询检查依赖关系
3. **最后删除函数**：按照优先级逐步删除未使用的函数
4. **创建迁移文件**：将删除操作记录在 Prisma migration 中

## ⚠️ 注意事项

1. **备份数据库**：在执行任何删除操作之前，请备份数据库
2. **测试环境先试**：在开发/测试环境先执行，确认无误后再在生产环境执行
3. **保留迁移历史**：即使删除函数，也建议在迁移文件中记录删除操作，以便追溯
4. **监控影响**：删除后监控应用运行情况，确保没有遗漏的依赖

## 📅 执行计划

- [ ] 阶段 1：清理重复的 welcome trigger 文件
- [ ] 阶段 2：验证函数依赖关系
- [ ] 阶段 3：在测试环境删除未使用的函数
- [ ] 阶段 4：监控测试环境
- [ ] 阶段 5：在生产环境执行清理（如果测试通过）

