# Feed随机化修复报告

## 问题描述
用户反馈：刷新feed时内容不变，没有随机刷出新东西。

## 问题分析

### 原始问题
1. **排序逻辑问题**：原始的排序是 `ORDER BY final_score_num DESC, md5(item_id::text || seed)`
   - 只有当 `final_score_num` 完全相同时，seed才会影响排序
   - 但实际上大多数商品的分数都不同，所以seed基本不起作用

2. **测试结果**：
   - 使用seed=12345和seed=99999，返回的商品ID完全相同
   - 说明seed没有真正影响排序

### 根本原因
- 商品分数差异较大，导致只有极少数商品会在同一分数下
- seed仅作为第二排序键，在分数不同的情况下不起作用

## 解决方案

### 1. 引入分数桶（Score Bucket）机制
- 将商品按分数范围分组到不同的bucket中
- 在每个bucket内，使用seed进行随机排序
- 这样既保持了推荐质量（高分商品优先），又增加了多样性

### 2. Bucket大小优化
- 初始bucket大小：0.05（太小，大多数bucket只有1个商品）
- 优化后bucket大小：0.1（更大，更多商品在同一bucket中）
- 效果：bucket 3有4个商品，bucket 2有6个商品，可以更好地随机化

### 3. 实现细节
```sql
bucketed AS (
  SELECT
    d.*,
    -- 创建分数桶：每0.1分为一个bucket
    floor(d.final_score_num / 0.1)::int AS score_bucket,
    -- 基于item_id和seed生成确定性的随机值
    abs(hashtext(d.item_id::text || v_seed))::numeric AS seed_hash
  FROM decayed d
)
ORDER BY
  b.score_bucket DESC,  -- 高分bucket优先
  b.seed_hash DESC      -- bucket内按seed随机排序
```

## 测试结果

### 测试1：不同seed产生不同排序
- seed=12345: [36,84,72,60,197,123,88,479,211,180]
- seed=99999: [36,84,72,60,197,123,479,211,89,180]
- **结果**：第7-10个位置的商品顺序不同 ✅

### 测试2：Bucket分布
- bucket 5: 1个商品（最高分）
- bucket 4: 1个商品
- bucket 3: 4个商品（可以随机排序）
- bucket 2: 6个商品（可以随机排序）
- bucket 1: 8个商品（可以随机排序）

### 测试3：多个seed测试
测试了5个不同的seed值（12345, 99999, 55555, 11111, 88888），每个seed都产生了不同的排序。

## 当前行为

### 预期行为
1. **前几个高分商品**：由于分数差距较大，它们在不同的bucket中，所以排序相对稳定
   - 这是预期的，因为高分商品应该优先显示
2. **中低分商品**：在相同的bucket中，会根据seed产生不同的排序
   - 这样用户刷新时能看到不同的商品

### 可能的问题
如果用户感觉"刷feed都不变"，可能是因为：
1. **前几个商品不变**：这是预期的，因为它们分数最高
2. **缓存问题**：检查缓存键是否包含seed（已包含 ✅）
3. **刷新时seed变化不够**：如果用户快速连续刷新，seed可能变化不大

## 缓存机制
- 缓存键包含seed：`${mode}|uid=${userId}|p=${page}|l=${limit}|seed=${seedId}`
- 刷新时设置`noStore=1`，绕过缓存
- 缓存TTL：20秒

## 前端刷新逻辑
```typescript
const refresh = useCallback(async () => {
  setRefreshing(true);
  seedRef.current = (Date.now() % INT32_MAX) | 0;  // 更新seed
  viewedBoostedItemsRef.current.clear();
  await loadInitial();  // bypassCache=true
  setRefreshing(false);
}, [loadInitial]);
```

## 建议

### 如果用户仍然感觉变化不够
1. **增加bucket大小**：从0.1增加到0.15或0.2，让更多商品在同一bucket中
2. **增加随机性权重**：在排序时，不仅仅按bucket排序，还考虑更多的随机因素
3. **减少缓存时间**：将缓存TTL从20秒减少到10秒或更短

### 验证方法
1. 测试不同的seed值，确认产生不同的排序
2. 检查前端刷新时seed是否真的变化
3. 检查缓存是否被正确绕过
4. 测试连续快速刷新，看看是否有明显变化

## 迁移文件
- `web/prisma/migrations/20251110000001_fix_get_feed_v2_read_gender_from_db/migration.sql`
- 已应用迁移：`fix_get_feed_v2_seed_randomization`
- 已应用迁移：`increase_feed_randomization_bucket_size`

## 状态
✅ 已修复并应用
✅ 测试通过
✅ 不同seed产生不同排序

## 下一步
1. 监控用户反馈
2. 如果变化仍然不够明显，考虑进一步优化bucket大小或增加随机性
3. 考虑在前端添加更明显的刷新指示，让用户知道内容已更新

