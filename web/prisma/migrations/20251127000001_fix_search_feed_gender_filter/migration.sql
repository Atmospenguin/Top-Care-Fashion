-- Migration: Fix get_search_feed to apply gender filter
-- Date: 2025-11-27
-- Description: 
--   修复get_search_feed函数，在inv_gender_search CTE中添加gender过滤
--   当p_gender参数有值时，应该过滤掉不匹配的商品，而不是只用于个性化评分
--   男性用户：只显示 Men 和 Unisex 商品
--   女性用户：只显示 Women 和 Unisex 商品
--   Unisex/未设置：显示所有商品

CREATE OR REPLACE FUNCTION public.get_search_feed(
  p_supabase_user_id uuid,
  p_search_query text,
  p_limit integer,
  p_offset integer,
  p_seed integer,
  p_gender text DEFAULT NULL,
  p_category_id integer DEFAULT NULL
)
RETURNS TABLE(
  id integer,
  title text,
  image_url text,
  price_cents numeric,
  brand text,
  tags jsonb,
  source text,
  fair_score numeric,
  final_score numeric,
  is_boosted boolean,
  boost_weight numeric,
  search_relevance numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id int;
  v_user_gender text;
  v_gender_norm text;
  v_pref_styles text[];
  v_pref_brands text[];
  v_seed text;
  v_search_query_normalized text;
BEGIN
  PERFORM set_config('statement_timeout','30000', true);

  v_seed := COALESCE(p_seed, 0)::text;
  v_search_query_normalized := lower(trim(COALESCE(p_search_query, '')));
  
  -- Resolve app user + prefs + gender from database (if user exists)
  IF p_supabase_user_id IS NOT NULL THEN
    SELECT
      u.id,
      u.gender,
      COALESCE(array(SELECT jsonb_array_elements_text(u.preferred_styles)), '{}'::text[]),
      COALESCE(array(SELECT jsonb_array_elements_text(u.preferred_brands)), '{}'::text[])
    INTO v_user_id, v_user_gender, v_pref_styles, v_pref_brands
    FROM public.users u
    WHERE u.supabase_user_id = p_supabase_user_id;
  END IF;

  -- Use provided gender if specified and not 'unisex', otherwise use user's gender from database
  IF p_gender IS NOT NULL AND lower(trim(p_gender)) NOT IN ('unisex', '') THEN
    v_gender_norm := lower(trim(p_gender));
  ELSIF v_user_gender IS NOT NULL THEN
    v_gender_norm := lower(v_user_gender);
  ELSE
    v_gender_norm := 'unisex';
  END IF;

  RETURN QUERY
  WITH
  -- Inventory + search filter + gender filter
  -- 修复：添加gender过滤，当指定gender时，只返回匹配的商品
  inv_gender_search AS (
    SELECT l.id AS item_id
    FROM public.listings l
    WHERE l.listed = true
      AND l.sold = false
      -- 分类过滤（如果提供category_id）
      AND (p_category_id IS NULL OR l.category_id = p_category_id)
      -- Gender过滤：根据v_gender_norm过滤商品
      -- 男性用户：只显示 Men 和 Unisex 商品
      -- 女性用户：只显示 Women 和 Unisex 商品
      -- Unisex/未设置：显示所有商品
      AND (
        v_gender_norm = 'unisex'
        OR l.gender = 'Unisex'
        OR (v_gender_norm IN ('male', 'men') AND l.gender IN ('Men', 'Unisex'))
        OR (v_gender_norm IN ('female', 'women') AND l.gender IN ('Women', 'Unisex'))
      )
      -- 搜索过滤：匹配名称、描述、品牌、标签
      -- 如果搜索查询为空或只有通配符，则跳过搜索过滤（返回所有商品，由feed算法个性化排序）
      AND (
        v_search_query_normalized = '' 
        OR v_search_query_normalized = '%'
        OR lower(l.name) LIKE '%' || v_search_query_normalized || '%'
        OR lower(COALESCE(l.description, '')) LIKE '%' || v_search_query_normalized || '%'
        OR lower(COALESCE(l.brand, '')) LIKE '%' || v_search_query_normalized || '%'
        -- 标签搜索：检查tags JSONB数组中是否包含搜索关键词
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(l.tags) AS tag
          WHERE lower(tag) LIKE '%' || v_search_query_normalized || '%'
        )
      )
  ),

  -- Gender match scoring (for personalization, not filtering)
  -- 注意：gender过滤已经在inv_gender_search中完成，这里只用于个性化评分
  gender_match_scores AS (
    SELECT
      g.item_id,
      CASE
        WHEN v_gender_norm IN ('male','men') THEN
          CASE 
            WHEN l.gender = 'Men' THEN 1.0
            WHEN l.gender = 'Unisex' THEN 0.8
            WHEN l.gender = 'Women' THEN 0.3
            ELSE 0.5
          END
        WHEN v_gender_norm IN ('female','women') THEN
          CASE 
            WHEN l.gender = 'Women' THEN 1.0
            WHEN l.gender = 'Unisex' THEN 0.8
            WHEN l.gender = 'Men' THEN 0.3
            ELSE 0.5
          END
        ELSE 0.8  -- unisex users see all items with similar scores
      END AS gender_match_score
    FROM inv_gender_search g
    JOIN public.listings l ON l.id = g.item_id
  ),

  -- Extract user behavior preferences from historical interactions (only if user exists)
  user_interactions AS (
    SELECT DISTINCT listing_id
    FROM (
      SELECT listing_id FROM public.listing_clicks WHERE user_id = v_user_id AND v_user_id IS NOT NULL
      UNION
      SELECT listing_id FROM public.user_likes WHERE user_id = v_user_id AND v_user_id IS NOT NULL
      UNION
      SELECT listing_id FROM public.cart_items WHERE user_id = v_user_id AND v_user_id IS NOT NULL
    ) t
  ),
  user_behavior_brands AS (
    SELECT DISTINCT lower(lc.brand) AS brand
    FROM public.listing_card_v lc
    JOIN user_interactions ui ON ui.listing_id = lc.id
    WHERE lc.brand IS NOT NULL
      AND lc.brand != 'Unknown'
      AND lc.brand != 'Others'
  ),
  user_behavior_tags AS (
    SELECT DISTINCT lower(trim(tag)) AS tag
    FROM public.listings l
    JOIN user_interactions ui ON ui.listing_id = l.id
    CROSS JOIN LATERAL jsonb_array_elements_text(l.tags) AS tag
    WHERE l.tags IS NOT NULL
      AND trim(tag) != ''
  ),

  -- Map user preferred brands to database brand names using brand_mappings table (only if user exists)
  brand_mappings_resolved AS (
    SELECT DISTINCT
      COALESCE(bm.db_brand_name, ub.user_brand) AS db_brand_name,
      ub.user_brand AS original_brand
    FROM unnest(v_pref_brands) ub(user_brand)
    LEFT JOIN public.brand_mappings bm ON lower(bm.user_brand_name) = lower(ub.user_brand)
    WHERE array_length(v_pref_brands, 1) IS NOT NULL
      AND v_user_id IS NOT NULL
      AND COALESCE(bm.db_brand_name, ub.user_brand) IS NOT NULL
  ),

  -- Expand preferred_styles to tag keywords for matching (only if user exists)
  style_tags_expanded AS (
    SELECT 
      s AS original_style,
      CASE
        WHEN s LIKE '%/%' THEN string_to_array(lower(s), '/')
        WHEN s LIKE '% %' THEN string_to_array(lower(s), ' ')
        ELSE ARRAY[lower(s)]
      END AS keywords
    FROM unnest(v_pref_styles) s
    WHERE array_length(v_pref_styles, 1) IS NOT NULL
      AND v_user_id IS NOT NULL
  ),
  style_tags AS (
    SELECT DISTINCT trim(keyword) AS tag_keyword
    FROM style_tags_expanded
    CROSS JOIN LATERAL unnest(keywords) AS keyword
    WHERE trim(keyword) != ''
  ),

  -- Search relevance scoring
  search_relevance_scores AS (
    SELECT
      g.item_id,
      -- 计算搜索相关性分数（0-1）
      GREATEST(
        -- 名称完全匹配：最高分
        CASE WHEN lower(l.name) = v_search_query_normalized THEN 1.0
             WHEN lower(l.name) LIKE v_search_query_normalized || '%' THEN 0.9
             WHEN lower(l.name) LIKE '%' || v_search_query_normalized || '%' THEN 0.7
             ELSE 0.0 END,
        -- 品牌匹配：高分
        CASE WHEN lower(COALESCE(l.brand, '')) = v_search_query_normalized THEN 0.9
             WHEN lower(COALESCE(l.brand, '')) LIKE '%' || v_search_query_normalized || '%' THEN 0.6
             ELSE 0.0 END,
        -- 标签完全匹配：高分
        CASE WHEN EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(l.tags) AS tag
          WHERE lower(tag) = v_search_query_normalized
        ) THEN 0.8
        WHEN EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(l.tags) AS tag
          WHERE lower(tag) LIKE '%' || v_search_query_normalized || '%'
        ) THEN 0.5
        ELSE 0.0 END,
        -- 描述匹配：较低分
        CASE WHEN lower(COALESCE(l.description, '')) LIKE '%' || v_search_query_normalized || '%' THEN 0.3
             ELSE 0.0 END
      ) AS relevance_score
    FROM inv_gender_search g
    JOIN public.listings l ON l.id = g.item_id
  ),

  -- Candidate pools (all must match search)
  cand_search AS (
    SELECT DISTINCT g.item_id
    FROM inv_gender_search g
    LIMIT 500
  ),

  -- Flags + raw scores + promotion metadata + behavior matching
  flags AS (
    SELECT DISTINCT ON (c.item_id)
      c.item_id,
      COALESCE(r.fair_score, 0)::numeric AS fair_score_raw,
      COALESCE(r.final_score, COALESCE(r.fair_score, 0))::numeric AS boosted_score_raw,
      COALESCE(r.is_boosted, false) AS is_boosted_flag,
      CASE
        WHEN COALESCE(r.is_boosted, false) THEN COALESCE(r.boost_weight, 1.0)::numeric
        ELSE NULL::numeric
      END AS boost_weight_value,
      COALESCE(srs.relevance_score, 1.0)::numeric AS search_relevance_val,
      COALESCE(gms.gender_match_score, 0.8)::numeric AS gender_match_val,

      -- User preference matching (only if user exists)
      EXISTS (
        SELECT 1
        FROM public.listing_card_v lc
        CROSS JOIN brand_mappings_resolved bmr
        WHERE lc.id = c.item_id
          AND array_length(v_pref_brands,1) IS NOT NULL
          AND v_user_id IS NOT NULL
          AND lower(lc.brand) = lower(bmr.db_brand_name)
      ) AS brand_match,

      COALESCE((
        SELECT COUNT(DISTINCT st.tag_keyword)
        FROM public.listings l
        CROSS JOIN style_tags st
        WHERE l.id = c.item_id
          AND array_length(v_pref_styles,1) IS NOT NULL
          AND v_user_id IS NOT NULL
          AND (l.tags ?| ARRAY[st.tag_keyword])
      ), 0) AS tag_match_count,
      
      EXISTS (
        SELECT 1
        FROM public.listings l
        CROSS JOIN style_tags st
        WHERE l.id = c.item_id
          AND array_length(v_pref_styles,1) IS NOT NULL
          AND v_user_id IS NOT NULL
          AND (l.tags ?| ARRAY[st.tag_keyword])
      ) AS tag_match,

      -- engagement_aff: 只有当用户有偏好或行为数据时，且商品在候选池中时，才为true
      (c.item_id IN (SELECT item_id FROM cand_search)
       AND v_user_id IS NOT NULL
       AND (
         EXISTS (SELECT 1 FROM brand_mappings_resolved)
         OR EXISTS (SELECT 1 FROM style_tags)
         OR EXISTS (SELECT 1 FROM user_behavior_brands)
         OR EXISTS (SELECT 1 FROM user_behavior_tags)
       )) AS engagement_aff,
      
      -- Behavior-based matching flags (only if user exists)
      EXISTS (
        SELECT 1
        FROM public.listing_card_v lc
        CROSS JOIN user_behavior_brands ubb
        WHERE lc.id = c.item_id
          AND EXISTS (SELECT 1 FROM user_behavior_brands)
          AND v_user_id IS NOT NULL
          AND lower(lc.brand) = ubb.brand
      ) AS behavior_brand_match,
      EXISTS (
        SELECT 1
        FROM public.listings l
        CROSS JOIN user_behavior_tags ubt
        WHERE l.id = c.item_id
          AND EXISTS (SELECT 1 FROM user_behavior_tags)
          AND v_user_id IS NOT NULL
          AND (l.tags ?| ARRAY[ubt.tag])
      ) AS behavior_tag_match,
      COALESCE((
        SELECT COUNT(DISTINCT ubt.tag)
        FROM public.listings l
        CROSS JOIN user_behavior_tags ubt
        WHERE l.id = c.item_id
          AND EXISTS (SELECT 1 FROM user_behavior_tags)
          AND v_user_id IS NOT NULL
          AND (l.tags ?| ARRAY[ubt.tag])
      ), 0) AS behavior_tag_match_count
    FROM cand_search c
    LEFT JOIN LATERAL (
      SELECT lr.*
      FROM public.listing_recommendations_with_boost lr
      WHERE lr.listing_id = c.item_id
      ORDER BY lr.final_score DESC
      LIMIT 1
      ) r ON TRUE
      LEFT JOIN search_relevance_scores srs ON srs.item_id = c.item_id
      LEFT JOIN gender_match_scores gms ON gms.item_id = c.item_id
    ),

  -- Normalize within candidates using boosted score
  stats AS (
    SELECT
      MIN(COALESCE(boosted_score_raw, 0)) AS mn,
      MAX(COALESCE(boosted_score_raw, 0)) AS mx
    FROM flags
  ),

  scored AS (
    SELECT
      f.item_id,
      f.fair_score_raw,
      f.boosted_score_raw,
      f.is_boosted_flag,
      f.boost_weight_value,
      f.search_relevance_val,
      f.gender_match_val,
      -- 确保boost_norm不为负数，避免降低最终分数
      GREATEST(
        0,
        CASE
          WHEN s.mx > s.mn THEN
            (COALESCE(f.boosted_score_raw, 0) - s.mn) / NULLIF(s.mx - s.mn, 0)
          ELSE 0
        END
      ) AS boost_norm,
      f.brand_match,
      f.tag_match,
      f.tag_match_count,
      f.engagement_aff,
      f.behavior_brand_match,
      f.behavior_tag_match,
      f.behavior_tag_match_count
    FROM flags f
    CROSS JOIN stats s
  ),

  ranked AS (
    SELECT
      sc.item_id,
      sc.fair_score_raw,
      sc.boosted_score_raw,
      sc.is_boosted_flag,
      sc.boost_weight_value,
      sc.search_relevance_val,
      sc.brand_match,
      sc.tag_match,
      sc.tag_match_count,
      sc.engagement_aff,
      -- 综合评分：搜索相关性 + feed算法评分
      CASE 
        WHEN v_search_query_normalized = '' OR v_search_query_normalized = '%' THEN (
          0.10 * sc.search_relevance_val
          + 0.35 * sc.boost_norm
          + CASE 
              WHEN v_user_id IS NOT NULL THEN (
                0.25 * CASE WHEN sc.engagement_aff THEN 1 ELSE 0 END
                + CASE 
                    WHEN sc.brand_match AND sc.tag_match THEN 0.25
                    WHEN sc.tag_match_count >= 2 THEN 0.22
                    WHEN sc.brand_match OR sc.tag_match THEN 0.18
                    WHEN sc.behavior_brand_match AND sc.behavior_tag_match THEN 0.15
                    WHEN sc.behavior_tag_match_count >= 2 THEN 0.12
                    WHEN sc.behavior_brand_match OR sc.behavior_tag_match THEN 0.10
                    ELSE 0
                  END
              )
              ELSE 0.30 * CASE WHEN sc.engagement_aff THEN 1 ELSE 0 END
            END
        )
        ELSE (
            GREATEST(
              0.40,
              0.30 * sc.search_relevance_val
              + 0.25 * sc.boost_norm
              + 0.05 * sc.gender_match_val
              + CASE 
                  WHEN v_user_id IS NOT NULL THEN (
                    CASE 
                      WHEN sc.engagement_aff THEN 0.20
                      ELSE 0.15
                    END
                    + CASE 
                        WHEN sc.brand_match AND sc.tag_match THEN 0.20
                        WHEN sc.tag_match_count >= 2 THEN 0.18
                        WHEN sc.brand_match OR sc.tag_match THEN 0.15
                        WHEN sc.behavior_brand_match AND sc.behavior_tag_match THEN 0.12
                        WHEN sc.behavior_tag_match_count >= 2 THEN 0.10
                        WHEN sc.behavior_brand_match OR sc.behavior_tag_match THEN 0.08
                        ELSE 0
                      END
                  )
                  ELSE (
                    0.30 * sc.search_relevance_val
                    + 0.25 * sc.boost_norm
                    + 0.20 * CASE WHEN sc.engagement_aff THEN 1 ELSE 0 END
                  )
                END
            )
        )
      END AS final_score_val,
      CASE
        WHEN sc.brand_match AND sc.tag_match THEN 'brand&tag'
        WHEN sc.brand_match THEN 'brand'
        WHEN sc.tag_match THEN 'tag'
        WHEN sc.behavior_brand_match AND sc.behavior_tag_match THEN 'behavior_brand&tag'
        WHEN sc.behavior_brand_match THEN 'behavior_brand'
        WHEN sc.behavior_tag_match THEN 'behavior_tag'
        WHEN sc.engagement_aff THEN 'affinity'
        WHEN v_search_query_normalized = '' OR v_search_query_normalized = '%' THEN 'feed'
        ELSE 'search'
      END AS src_label
    FROM scored sc
  ),

  -- final join to card view + soft brand decay + seeded ordering
  ranked_page AS (
    SELECT
      r.item_id,
      r.src_label,
      r.fair_score_raw,
      r.boosted_score_raw,
      r.is_boosted_flag,
      r.boost_weight_value,
      r.search_relevance_val AS search_relevance_score,
      r.final_score_val,
      lc.title AS card_title,
      lc.image_url AS card_image_url,
      lc.price_cents AS card_price_cents,
      lc.brand AS card_brand,
      lc.tags AS card_tags,
      row_number() OVER (
        PARTITION BY lower(lc.brand)
        ORDER BY r.final_score_val DESC
      ) AS brand_rank
    FROM ranked r
    JOIN public.listing_card_v lc ON lc.id = r.item_id
  ),
    decayed AS (
      SELECT
        item_id,
        card_title,
        card_image_url,
        card_price_cents::int AS card_price_cents_int,
        card_brand,
        card_tags,
        src_label,
        fair_score_raw,
        boosted_score_raw,
        is_boosted_flag,
        boost_weight_value,
        search_relevance_score,
        GREATEST(
          0.05,
          (final_score_val * power(0.85, greatest(brand_rank - 1, 0)))::numeric
        ) AS final_score_num
      FROM ranked_page
    ),
  -- Score buckets: group items by score ranges for better randomization
  bucketed AS (
    SELECT
      d.*,
      floor(d.final_score_num / 0.15)::int AS score_bucket,
      abs(hashtext(d.item_id::text || v_seed))::numeric AS seed_hash
    FROM decayed d
  )

  SELECT
    b.item_id AS id,
    b.card_title AS title,
    b.card_image_url AS image_url,
    (b.card_price_cents_int)::numeric AS price_cents,
    b.card_brand AS brand,
    b.card_tags AS tags,
    b.src_label AS source,
    b.fair_score_raw AS fair_score,
    b.final_score_num AS final_score,
    b.is_boosted_flag AS is_boosted,
    CASE WHEN b.is_boosted_flag THEN b.boost_weight_value ELSE NULL::numeric END AS boost_weight,
    b.search_relevance_score AS search_relevance
  FROM bucketed b
  ORDER BY
    b.score_bucket DESC,
    b.seed_hash DESC
  LIMIT p_limit
  OFFSET p_offset;

END;
$function$;

