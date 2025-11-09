# Boost/Promotion 算法与实现文档

## 📋 目录

1. [概述](#概述)
2. [数据库架构](#数据库架构)
3. [核心算法](#核心算法)
4. [API 接口](#api-接口)
5. [前端集成](#前端集成)
6. [使用示例](#使用示例)
7. [性能优化](#性能优化)
8. [故障排查](#故障排查)

---

## 概述

Boost/Promotion 功能允许卖家为商品购买推广服务，通过提高商品在 feed 中的排名来增加曝光度。系统使用基于权重的算法来调整商品在推荐系统中的排序。

### 核心特性

- ✅ **权重提升**：通过 `boost_weight` 字段控制商品在 feed 中的排名提升幅度
- ✅ **自动过期**：支持设置推广结束时间，到期后自动失效
- ✅ **性能追踪**：记录 views、clicks 等指标，计算 uplift 百分比
- ✅ **免费额度**：Premium 用户享有免费 boost 额度
- ✅ **多模式支持**：在 Trending 和 For You 两种 feed 模式中都生效

---

## 数据库架构

### 表结构：`listing_promotions`

```sql
CREATE TABLE listing_promotions (
  id                   SERIAL PRIMARY KEY,
  listing_id           INTEGER NOT NULL,
  seller_id            INTEGER NOT NULL,
  status               PromotionStatus DEFAULT 'ACTIVE',
  started_at           TIMESTAMPTZ DEFAULT NOW(),
  ends_at              TIMESTAMPTZ,
  views                INTEGER DEFAULT 0,
  clicks               INTEGER DEFAULT 0,
  view_uplift_percent  INTEGER DEFAULT 0,
  click_uplift_percent INTEGER DEFAULT 0,
  boost_weight         DECIMAL(4, 2) DEFAULT 1.50,  -- 核心字段
  used_free_credit     BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);
```

### 关键字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `boost_weight` | DECIMAL(4,2) | 排名提升权重，默认 1.50（即 50% 提升） |
| `status` | PromotionStatus | ACTIVE/SCHEDULED/EXPIRED |
| `ends_at` | TIMESTAMPTZ | 推广结束时间，用于自动过期 |
| `view_uplift_percent` | INTEGER | 浏览量提升百分比 |
| `click_uplift_percent` | INTEGER | 点击量提升百分比 |

### 视图：`listing_recommendations_with_boost`

该视图将基础推荐分数与 boost 信息结合：

```sql
CREATE VIEW listing_recommendations_with_boost AS
SELECT
  lr.listing_id,
  lr.fair_score,
  lp.boost_weight,
  -- 计算最终分数（应用 boost）
  CASE
    WHEN lp.status = 'ACTIVE' AND lp.ends_at > NOW() THEN
      lr.fair_score * COALESCE(lp.boost_weight, 1.0)
    ELSE
      lr.fair_score
  END AS final_score,
  -- 标记是否被 boost
  CASE
    WHEN lp.status = 'ACTIVE' AND lp.ends_at > NOW() THEN true
    ELSE false
  END AS is_boosted
FROM listing_recommendations_main_fair lr
LEFT JOIN listing_promotions lp
  ON lr.listing_id = lp.listing_id
  AND lp.status = 'ACTIVE'
  AND lp.ends_at > NOW();
```

**核心逻辑**：
- `final_score = fair_score × boost_weight`（当 boost 激活时）
- `is_boosted = true`（当状态为 ACTIVE 且未过期时）

---

## 核心算法

### 1. Trending Feed 算法

**位置**：`web/src/app/api/feed/home/route.ts` → `fetchTrending()`

**流程**：
1. 从 `listing_recommendations_with_boost` 视图查询
2. 按 `final_score` 降序排序（已包含 boost 权重）
3. 返回前 N 条结果

```typescript
const { data: recs } = await admin
  .from("listing_recommendations_with_boost")
  .select("listing_id,fair_score,final_score,is_boosted,boost_weight")
  .order("final_score", { ascending: false })
  .range(offset, offset + limit - 1);
```

### 2. For You Feed 算法

**位置**：`web/src/app/api/feed/home/route.ts` → `fetchForYou()`

**数据库函数**：`get_feed_v2()`

**算法流程**：

```
1. 候选池生成
   ├─ cand_trending: 从 listing_recommendations_with_boost 获取（已应用 boost）
   ├─ cand_brand: 基于用户偏好品牌
   └─ cand_tag: 基于用户偏好标签

2. Boost 信息提取
   ├─ 从 listing_recommendations_with_boost 视图获取
   ├─ 提取 fair_score, final_score, is_boosted, boost_weight
   └─ 使用 final_score（已应用 boost）进行归一化

3. 综合评分计算
   final_score_val = 0.55 × boost_norm          -- 55% 权重：boost 后的分数
                  + 0.25 × engagement_aff       -- 25% 权重：用户参与度
                  + 0.20 × (brand_match | tag_match)  -- 20% 权重：偏好匹配

4. 品牌去重衰减
   final_score_num = final_score_val × 0.85^(brand_rank - 1)

5. 排序与分页
   ORDER BY final_score_num DESC, md5(listing_id || seed)
```

**关键点**：
- ✅ 使用 `boosted_score_raw`（即 `final_score`）进行归一化，确保 boost 效果被正确考虑
- ✅ Boost 权重通过 `boost_norm` 影响最终排序（55% 权重）
- ✅ 返回 `is_boosted` 和 `boost_weight` 字段供前端显示

### 3. Boost 权重计算

**公式**：
```
final_score = fair_score × boost_weight
```

**示例**：
- `fair_score = 0.8`, `boost_weight = 1.50` → `final_score = 1.2`
- `fair_score = 0.8`, `boost_weight = 2.00` → `final_score = 1.6`（100% 提升）

**默认值**：
- `boost_weight = 1.50`（50% 提升）

---

## API 接口

### 1. 创建 Boost

**端点**：`POST /api/listings/boost`

**请求体**：
```json
{
  "listingIds": [123, 456],
  "plan": "free" | "premium",
  "useFreeCredits": true,
  "paymentMethodId": 789
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "createdCount": 2,
    "promotionIds": [1, 2],
    "freeCreditsUsed": 2,
    "paidBoostCount": 0,
    "totalCharge": 0,
    "pricePerBoost": 5.99,
    "currency": "USD"
  }
}
```

**业务逻辑**：
1. 验证用户权限和商品所有权
2. 检查免费额度（Premium 用户）
3. 计算费用（免费额度用完后）
4. 创建 `listing_promotions` 记录
5. 设置 `boost_weight = 1.50`（默认值）
6. 设置 `ends_at = started_at + 3 days`（默认 3 天）

### 2. 获取 Boosted Listings

**端点**：`GET /api/listings/boosted`

**响应**：
```json
{
  "items": [
    {
      "id": 1,
      "listing_id": 123,
      "status": "ACTIVE",
      "started_at": "2025-01-10T00:00:00Z",
      "ends_at": "2025-01-13T00:00:00Z",
      "views": 150,
      "clicks": 25,
      "view_uplift_percent": 50,
      "click_uplift_percent": 30,
      "title": "Vintage Denim Jacket",
      "price": 89.99,
      "size": "M"
    }
  ]
}
```

**功能**：
- 自动将过期的 promotion 状态更新为 EXPIRED
- 返回 ACTIVE、SCHEDULED 和最近过期的记录

### 3. Feed API（已集成 Boost）

**端点**：`GET /api/feed/home?mode=foryou|trending`

**响应字段**：
```typescript
{
  items: [
    {
      id: number;
      title: string;
      image_url: string;
      price_cents: number;
      brand: string;
      tags: string[];
      source: "trending" | "brand" | "tag" | "brand&tag" | "affinity";
      fair_score: number;        // 原始分数
      final_score: number;      // 应用 boost 后的分数
      is_boosted: boolean;      // 是否被 boost
      boost_weight?: number;    // boost 权重（仅当 is_boosted=true 时）
    }
  ]
}
```

---

## 前端集成

### 1. TypeScript 类型定义

**位置**：`mobile/types/shop.ts`

```typescript
export type ListingItem = {
  // ... 其他字段
  is_boosted?: boolean;
  boost_weight?: number | null;
};
```

**位置**：`mobile/src/config/api.ts`

```typescript
export type HomeFeedItem = {
  // ... 其他字段
  final_score?: number | null;
  is_boosted?: boolean;
  boost_weight?: number | null;
};
```

### 2. UI 显示

**位置**：`mobile/screens/main/HomeStack/FeedList.tsx`

```tsx
{item.is_boosted && (
  <View style={styles.boostBadge}>
    <Ionicons name="flash-outline" size={16} color="#FFD700" />
  </View>
)}
```

**位置**：`mobile/screens/main/MyTopStack/BoostedListingScreen.tsx`

显示 boost 统计信息：
- Views 和 Clicks
- View Uplift % 和 Click Uplift %
- Boost 状态（ACTIVE/SCHEDULED/EXPIRED）

---

## 使用示例

### 示例 1：创建 Boost

```typescript
// 前端调用
const response = await fetch('/api/listings/boost', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    listingIds: [123, 456],
    plan: 'free',
    useFreeCredits: true
  })
});

const result = await response.json();
console.log(`Created ${result.data.createdCount} boosts`);
```

### 示例 2：查询 Feed（包含 Boost）

```typescript
// 前端调用
const response = await fetch('/api/feed/home?mode=foryou&limit=20', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const feed = await response.json();
feed.items.forEach(item => {
  if (item.is_boosted) {
    console.log(`Item ${item.id} is boosted with weight ${item.boost_weight}`);
    console.log(`Score: ${item.fair_score} → ${item.final_score}`);
  }
});
```

### 示例 3：直接查询数据库视图

```sql
-- 查看所有被 boost 的商品
SELECT 
  listing_id,
  fair_score,
  final_score,
  boost_weight,
  is_boosted
FROM listing_recommendations_with_boost
WHERE is_boosted = true
ORDER BY final_score DESC
LIMIT 20;
```

---

## 性能优化

### 1. 索引优化

```sql
-- 针对活跃 boost 的复合索引
CREATE INDEX idx_listing_promotions_active_boosted
  ON listing_promotions(listing_id, status, ends_at)
  WHERE status = 'ACTIVE';
```

**效果**：
- 加速 `listing_recommendations_with_boost` 视图的 JOIN 操作
- 快速过滤活跃的 promotion

### 2. 视图缓存

`listing_recommendations_with_boost` 视图在数据库层面缓存，减少重复计算。

### 3. API 缓存

Feed API 使用内存缓存（20 秒 TTL）：
```typescript
const CACHE_TTL_MS = 20_000;
const cache = new Map<string, { data: FeedRow[]; ts: number }>();
```

### 4. 函数优化

`get_feed_v2` 函数：
- 设置 30 秒超时：`set_config('statement_timeout','30000')`
- 限制候选池大小：每个来源最多 300 条
- 使用 LATERAL JOIN 优化 boost 信息查询

---

## 故障排查

### 问题 1：Boost 不生效

**症状**：商品购买了 boost，但在 feed 中排名没有提升

**检查清单**：
1. ✅ 确认 `status = 'ACTIVE'`
2. ✅ 确认 `ends_at > NOW()`
3. ✅ 检查 `boost_weight` 值（默认应为 1.50）
4. ✅ 验证 `listing_recommendations_with_boost` 视图是否正确计算 `final_score`

**SQL 检查**：
```sql
SELECT 
  lp.id,
  lp.status,
  lp.ends_at,
  lp.boost_weight,
  lr.fair_score,
  lr.final_score,
  lr.is_boosted
FROM listing_promotions lp
JOIN listing_recommendations_with_boost lr ON lr.listing_id = lp.listing_id
WHERE lp.listing_id = YOUR_LISTING_ID;
```

### 问题 2：列名冲突错误

**错误信息**：
```
column reference "is_boosted" is ambiguous
column reference "boost_weight" is ambiguous
```

**原因**：函数内部 CTE 使用了与输出列相同的名称

**解决方案**：在函数内部使用不同的别名（如 `is_boosted_flag`、`boost_weight_value`），只在最终 SELECT 时映射回标准名称。

### 问题 3：Feed API 返回 500

**检查步骤**：
1. 查看服务器日志中的详细错误信息
2. 验证 `get_feed_v2` 函数是否存在且签名正确
3. 检查用户是否有有效的 `supabase_user_id`
4. 确认数据库连接正常

**调试命令**：
```bash
# 检查函数定义
npm run db:check

# 直接测试函数
SELECT * FROM get_feed_v2(
  'user-uuid-here'::uuid,
  'foryou',
  20,
  0,
  12345,
  'unisex'
);
```

### 问题 4：Boost 过期未更新

**症状**：`ends_at` 已过期，但 `status` 仍为 ACTIVE

**解决方案**：`GET /api/listings/boosted` 会自动更新过期状态，或手动执行：

```sql
UPDATE listing_promotions
SET status = 'EXPIRED', updated_at = NOW()
WHERE status = 'ACTIVE'
  AND ends_at IS NOT NULL
  AND ends_at <= NOW();
```

---

## 数据库迁移

### 迁移文件

1. **`20251108103000_add_listing_promotions`**：创建 `listing_promotions` 表
2. **`20251109000000_add_boost_weight_and_feed_view`**：添加 `boost_weight` 字段和 `listing_recommendations_with_boost` 视图
3. **`20251109094500_update_get_feed_v2_for_boost`**：更新 `get_feed_v2` 函数以支持 boost

### 应用迁移

```bash
cd web
npx prisma migrate deploy
```

---

## 未来改进方向

1. **动态权重调整**：根据商品类别、价格等因素动态调整 `boost_weight`
2. **A/B 测试**：支持不同 boost 策略的 A/B 测试
3. **实时统计**：实时更新 views/clicks 和 uplift 百分比
4. **批量操作**：支持批量修改 boost 权重或延长有效期
5. **智能推荐**：基于历史数据推荐最佳 boost 时机

---

## 相关文件

### 后端
- `web/prisma/schema.prisma` - 数据模型定义
- `web/prisma/migrations/*/migration.sql` - 数据库迁移
- `web/src/app/api/listings/boost/route.ts` - 创建 boost API
- `web/src/app/api/listings/boosted/route.ts` - 获取 boosted listings API
- `web/src/app/api/feed/home/route.ts` - Feed API（集成 boost）

### 前端
- `mobile/types/shop.ts` - TypeScript 类型定义
- `mobile/src/config/api.ts` - API 类型定义
- `mobile/screens/main/HomeStack/FeedList.tsx` - Feed 列表显示
- `mobile/screens/main/MyTopStack/BoostedListingScreen.tsx` - Boost 管理界面

---

## 更新日志

- **2025-01-09**: 初始实现，添加 `boost_weight` 字段和基础视图
- **2025-01-09**: 更新 `get_feed_v2` 函数，集成 boost 算法
- **2025-01-09**: 修复列名冲突问题，优化函数性能

---

**文档版本**: 1.0  
**最后更新**: 2025-01-09  
**维护者**: Development Team

