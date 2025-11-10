# Feed算法参数说明

## 当前算法考虑的参数

### 1. 用户偏好参数

#### 1.1 性别 (Gender)
- **来源**: `users.gender` (Men/Women/Unisex)
- **作用**: 过滤商品，只显示匹配用户性别的商品
- **逻辑**:
  - 男性用户: 显示 `Men` 和 `Unisex` 商品
  - 女性用户: 显示 `Women` 和 `Unisex` 商品
  - 未设置性别: 显示所有商品

#### 1.2 偏好品牌 (Preferred Brands)
- **来源**: `users.preferred_brands` (JSONB数组)
- **作用**: 提升用户偏好品牌的商品排名
- **匹配逻辑**:
  - 通过 `brand_mappings` 表映射用户选择的品牌名称到数据库品牌名称
  - 支持品牌名称变体和别名
  - 如果品牌在数据库中不存在，映射为 NULL（不匹配）
- **权重**: 品牌匹配在最终评分中占 0.28-0.35 权重

#### 1.3 偏好风格 (Preferred Styles)
- **来源**: `users.preferred_styles` (JSONB数组)
- **作用**: 提升用户偏好风格的商品排名
- **匹配逻辑**:
  - 将复合风格（如 "90s/Y2K"）拆分为多个关键词（"90s", "y2k"）
  - 将多词风格（如 "Luxury Designer"）拆分为多个关键词（"luxury", "designer"）
  - 匹配商品的 `tags` 字段
  - 计算匹配的标签数量 (`tag_match_count`)
- **权重**: 
  - 单个标签匹配: 0.28 权重
  - 多个标签匹配（≥2）: 0.32 权重
  - 品牌+标签同时匹配: 0.35 权重（最高优先级）

#### 1.4 历史行为偏好 (Behavior-based Preferences)
- **来源**: 用户历史交互数据
  - `listing_clicks`: 用户点击的商品
  - `user_likes`: 用户点赞的商品
  - `cart_items`: 用户加购的商品
- **作用**: 基于用户历史交互，自动发现用户偏好的品牌和标签，推荐相似商品
- **匹配逻辑**:
  - 分析用户交互过的所有商品
  - 提取这些商品的品牌和标签
  - 推荐有相似品牌或标签的商品（但排除用户已交互过的商品）
  - 只对有交互历史的用户生效
- **权重**: 
  - 行为品牌+标签匹配: 0.25 权重
  - 行为多个标签匹配（≥2）: 0.22 权重
  - 行为品牌或标签匹配: 0.18 权重
- **优势**:
  - 自动发现用户偏好，无需用户手动设置
  - 推荐用户可能喜欢但还没发现的商品
  - 增加feed的个性化程度

### 2. 商品数据参数

#### 2.1 基础商品信息
- **listed**: 商品必须已上架 (`listed = true`)
- **sold**: 商品必须未售出 (`sold = false`)
- **gender**: 商品性别 (Men/Women/Unisex)
- **brand**: 商品品牌
- **tags**: 商品标签 (JSONB数组)

#### 2.2 Trending Score (趋势分数)
- **来源**: `listing_recommendations_main_fair.fair_score`
- **计算**: 基于商品的浏览量、点赞数、点击量等指标
- **作用**: 反映商品的流行度和热度
- **权重**: 在最终评分中占 0.40 权重（通过 `boost_norm` 标准化后）

#### 2.3 Boost/Promotion (推广)
- **来源**: `listing_promotions` 表
- **参数**:
  - `boost_weight`: 推广权重（默认 1.50，即 50% 提升）
  - `status`: 推广状态 (ACTIVE/SCHEDULED/EXPIRED)
  - `ends_at`: 推广结束时间
- **计算**: `final_score = fair_score × boost_weight`（当推广激活时）
- **权重**: 在最终评分中占 0.40 权重（通过 `boost_norm` 标准化后）

### 3. 最终评分计算

#### 3.1 评分公式
```
final_score_val = 
  0.40 × boost_norm                    -- 40%: 推广后的趋势分数（标准化）
  + 0.30 × engagement_aff              -- 30%: 用户偏好匹配（品牌或标签）
  + CASE
      --  explicit preferences (用户手动选择的品牌/风格) - 最高优先级
      WHEN brand_match AND tag_match THEN 0.35      -- 品牌+标签同时匹配
      WHEN tag_match_count >= 2 THEN 0.32           -- 多个标签匹配
      WHEN brand_match OR tag_match THEN 0.28       -- 单个匹配
      -- behavior-based recommendations (基于用户历史交互) - 中等优先级
      WHEN behavior_brand_match AND behavior_tag_match THEN 0.25  -- 行为: 品牌+标签
      WHEN behavior_tag_match_count >= 2 THEN 0.22  -- 行为: 多个标签
      WHEN behavior_brand_match OR behavior_tag_match THEN 0.18   -- 行为: 单个匹配
      ELSE 0
    END
```

#### 3.2 评分组件说明

**boost_norm** (0.40 权重):
- 将 `boosted_score_raw`（即 `final_score = fair_score × boost_weight`）标准化到 [0, 1] 范围
- 公式: `(boosted_score_raw - min) / (max - min)`
- 反映商品的趋势分数和推广效果

**engagement_aff** (0.30 权重):
- 布尔值，表示商品是否匹配用户的品牌或标签偏好
- 如果商品在 `cand_brand` 或 `cand_tag` 候选池中，则为 true

**brand_match / tag_match** (0.28-0.35 权重):
- `brand_match`: 商品品牌是否匹配用户偏好品牌
- `tag_match`: 商品标签是否匹配用户偏好风格
- `tag_match_count`: 匹配的标签数量
- 权重根据匹配情况动态调整:
  - 品牌+标签同时匹配: 0.35（最高）
  - 多个标签匹配: 0.32
  - 单个匹配: 0.28

### 4. 排序和随机化

#### 4.1 品牌多样性衰减 (Brand Decay)
- **公式**: `final_score_num = final_score_val × 0.85^(brand_rank - 1)`
- **作用**: 防止同一品牌的商品过度集中
- **逻辑**: 同一品牌内的商品，排名越靠后，分数衰减越多（0.85的幂次）

#### 4.2 分数桶随机化 (Score Buckets)
- **桶大小**: 0.15（`floor(final_score_num / 0.15)`）
- **作用**: 将相似分数的商品分组，允许在桶内随机排序
- **效果**: 增加feed的多样性，避免每次刷新都显示相同的商品顺序

#### 4.3 确定性随机排序 (Seeded Random)
- **方法**: 使用 `hashtext(item_id || seed)` 生成哈希值
- **作用**: 在分数桶内，根据种子（seed）确定性随机排序
- **效果**: 相同的种子产生相同的排序，但不同种子会产生不同的排序

### 5. 候选池生成

#### 5.1 Trending候选池 (`cand_trending`)
- **来源**: `listing_recommendations_with_boost` 视图
- **数量**: 前300个商品（按 `final_score` 降序）
- **作用**: 提供趋势商品作为候选

#### 5.2 Brand候选池 (`cand_brand`)
- **来源**: 匹配用户偏好品牌的商品（用户手动选择的品牌）
- **数量**: 最多300个商品
- **匹配**: 通过 `brand_mappings` 表映射品牌名称

#### 5.3 Tag候选池 (`cand_tag`)
- **来源**: 匹配用户偏好风格的商品（用户手动选择的风格）
- **数量**: 最多300个商品
- **匹配**: 通过展开的 `style_tags` 匹配商品标签

#### 5.4 Behavior Brand候选池 (`cand_behavior_brand`)
- **来源**: 匹配用户历史交互品牌的商品（从用户点击/点赞/加购的商品中提取）
- **数量**: 最多200个商品
- **匹配**: 匹配用户交互过的商品的品牌
- **排除**: 排除用户已交互过的商品
- **条件**: 只在用户有交互历史时生效

#### 5.5 Behavior Tag候选池 (`cand_behavior_tag`)
- **来源**: 匹配用户历史交互标签的商品（从用户点击/点赞/加购的商品中提取）
- **数量**: 最多200个商品
- **匹配**: 匹配用户交互过的商品的标签
- **排除**: 排除用户已交互过的商品
- **条件**: 只在用户有交互历史时生效

#### 5.6 最终候选池 (`cand`)
- **合并**: `cand_trending UNION cand_brand UNION cand_tag UNION cand_behavior_brand UNION cand_behavior_tag`
- **去重**: 使用 `UNION` 自动去重

### 6. 权重调整历史

#### 当前权重 (2025-11-10)
- `boost_norm`: 0.40 (从 0.55 降低)
- `engagement_aff`: 0.30 (从 0.25 提高)
- `brand_match / tag_match`: 0.28-0.35 (从 0.20 提高)

#### 调整原因
- 降低 `boost_norm` 权重，避免推广商品过度占据feed
- 提高用户偏好匹配权重，增强个性化推荐
- 区分不同匹配情况的权重，提高推荐精准度

### 7. 数据源

#### 7.1 用户数据
- `users` 表: 用户信息、偏好设置
- `users.preferred_brands`: 偏好品牌（JSONB数组）
- `users.preferred_styles`: 偏好风格（JSONB数组）
- `users.gender`: 用户性别

#### 7.2 商品数据
- `listings` 表: 商品基础信息
- `listing_card_v` 视图: 商品卡片视图
- `listing_recommendations_main_fair` 视图: 趋势分数
- `listing_recommendations_with_boost` 视图: 趋势分数+推广信息

#### 7.3 映射数据
- `brand_mappings` 表: 品牌名称映射
  - `user_brand_name`: 用户选择的品牌名称
  - `db_brand_name`: 数据库中实际的品牌名称（可为 NULL）

### 8. 输出字段

#### 8.1 商品信息
- `id`: 商品ID
- `title`: 商品标题
- `image_url`: 商品图片URL
- `price_cents`: 商品价格（分）
- `brand`: 商品品牌
- `tags`: 商品标签（JSONB数组）

#### 8.2 评分信息
- `fair_score`: 原始趋势分数（未应用推广）
- `final_score`: 最终分数（应用品牌衰减和随机化后）
- `is_boosted`: 是否被推广
- `boost_weight`: 推广权重

#### 8.3 来源标签
- `source`: 商品来源标签
  - `brand&tag`: 同时匹配用户选择的品牌和标签（最高优先级）
  - `brand`: 只匹配用户选择的品牌
  - `tag`: 只匹配用户选择的标签
  - `behavior_brand&tag`: 同时匹配用户历史交互的品牌和标签
  - `behavior_brand`: 只匹配用户历史交互的品牌
  - `behavior_tag`: 只匹配用户历史交互的标签
  - `affinity`: 匹配用户偏好（品牌或标签）
  - `trending`: 趋势商品（未匹配偏好）

### 9. 算法特点

#### 9.1 个性化推荐
- 基于用户偏好品牌和风格进行匹配
- 区分不同匹配情况的权重
- 支持品牌名称映射和风格关键词展开

#### 9.2 推广支持
- 支持商品推广（boost）
- 推广权重可配置（默认 1.50）
- 推广效果通过 `boost_norm` 影响最终排序

#### 9.3 多样性保证
- 品牌多样性衰减，防止同一品牌过度集中
- 分数桶随机化，增加feed多样性
- 确定性随机排序，保证刷新时的变化

#### 9.4 性能优化
- 使用视图预计算趋势分数
- 候选池限制（每个池最多300个商品）
- 使用索引优化查询性能

### 10. 已实现的优化

#### 10.1 基于用户历史交互的推荐 ✅
- **实现**: 分析用户点击、点赞、加购的商品
- **提取**: 自动提取用户偏好的品牌和标签
- **推荐**: 推荐有相似特征的商品（排除已交互的商品）
- **权重**: 0.18-0.25（中等优先级，低于用户手动选择的偏好）

#### 10.2 品牌映射表 ✅
- **实现**: `brand_mappings` 表映射用户选择的品牌名称到数据库品牌名称
- **支持**: 品牌名称变体和别名
- **扩展**: 可以轻松添加新的品牌映射

#### 10.3 风格标签智能展开 ✅
- **实现**: 自动拆分复合风格和多词风格
- **支持**: "90s/Y2K" → ["90s", "y2k"], "Luxury Designer" → ["luxury", "designer"]

### 11. 未来优化方向

#### 11.1 可以考虑的参数
- 商品价格范围偏好
- 商品类别偏好
- 时间因素（新商品、季节性商品）
- 地理位置（如果支持）
- 用户购买历史（推荐互补商品）

#### 11.2 可以优化的点
- 动态调整权重（基于用户反馈）
- 更精细的标签匹配（语义相似度）
- 更智能的品牌映射（自动学习）
- 更复杂的随机化策略（基于用户行为的多样性）
- 时间衰减（更近期的交互权重更高）
- 协同过滤（基于相似用户的行为推荐）

