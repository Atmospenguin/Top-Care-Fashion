-- Migration: Fix get_feed_v2 to read gender from database instead of parameter
-- Date: 2025-11-10
-- Description: 
--   get_feed_v2函数现在从users表读取gender字段，而不是依赖传入的参数
--   如果p_gender参数为null或'unisex'，函数会使用用户数据库中的gender值
--   这样用户更新性别后，feed会自动反映变化，无需前端传递参数
--
-- Migration: Add search feed function that integrates feed algorithm with search
-- Date: 2025-11-10
-- Description: 
--   创建get_search_feed函数，集成feed算法的个性化推荐和评分系统
--   支持搜索关键词过滤，同时应用用户偏好、boost、trending分数等
--   搜索范围包括：商品名称、描述、品牌、标签

-- Update get_feed_v2 function to read gender from users table
CREATE OR REPLACE FUNCTION public.get_feed_v2(
  p_supabase_user_id uuid,
  p_mode text,
  p_limit integer,
  p_offset integer,
  p_seed integer,
  p_gender text  -- 保留参数以保持兼容性，但如果为null或'unisex'，则从数据库读取
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
  boost_weight numeric
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
BEGIN
  PERFORM set_config('statement_timeout','30000', true);

  v_seed := COALESCE(p_seed, 0)::text;
  
  -- Resolve app user + prefs + gender from database
  SELECT
    u.id,
    u.gender,
    COALESCE(array(SELECT jsonb_array_elements_text(u.preferred_styles)), '{}'::text[]),
    COALESCE(array(SELECT jsonb_array_elements_text(u.preferred_brands)), '{}'::text[])
  INTO v_user_id, v_user_gender, v_pref_styles, v_pref_brands
  FROM public.users u
  WHERE u.supabase_user_id = p_supabase_user_id;

  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Use provided gender if specified and not 'unisex', otherwise use user's gender from database
  IF p_gender IS NOT NULL AND lower(trim(p_gender)) NOT IN ('unisex', '') THEN
    v_gender_norm := lower(trim(p_gender));
  ELSIF v_user_gender IS NOT NULL THEN
    -- Convert database gender enum to lowercase for comparison
    v_gender_norm := lower(v_user_gender);
  ELSE
    v_gender_norm := 'unisex';
  END IF;

  RETURN QUERY
  WITH
  -- Inventory + gender gate
  inv_gender AS (
    SELECT l.id AS item_id
    FROM public.listings l
    WHERE l.listed = true
      AND l.sold   = false
      AND (
        CASE
          WHEN v_gender_norm IN ('male','men')     THEN l.gender IN ('Men','Unisex')
          WHEN v_gender_norm IN ('female','women') THEN l.gender IN ('Women','Unisex')
          ELSE true
        END
      )
  ),

  -- Extract user behavior preferences from historical interactions
  -- Analyze user's clicks, likes, and cart items to find preferred brands and tags
  user_interactions AS (
    SELECT DISTINCT listing_id
    FROM (
      SELECT listing_id FROM public.listing_clicks WHERE user_id = v_user_id
      UNION
      SELECT listing_id FROM public.user_likes WHERE user_id = v_user_id
      UNION
      SELECT listing_id FROM public.cart_items WHERE user_id = v_user_id
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

  -- Candidate pools
  cand_trending AS (
    SELECT r.listing_id AS item_id
    FROM public.listing_recommendations_with_boost r
    JOIN inv_gender g ON g.item_id = r.listing_id
    ORDER BY r.final_score DESC
    LIMIT 300
  ),
  -- Map user preferred brands to database brand names using brand_mappings table
  -- This allows users to select brands that may have different names or formats
  brand_mappings_resolved AS (
    SELECT DISTINCT
      COALESCE(bm.db_brand_name, ub.user_brand) AS db_brand_name,
      ub.user_brand AS original_brand
    FROM unnest(v_pref_brands) ub(user_brand)
    LEFT JOIN public.brand_mappings bm ON lower(bm.user_brand_name) = lower(ub.user_brand)
    WHERE array_length(v_pref_brands, 1) IS NOT NULL
      AND COALESCE(bm.db_brand_name, ub.user_brand) IS NOT NULL
  ),
  cand_brand AS (
    SELECT DISTINCT g.item_id
    FROM inv_gender g
    JOIN public.listing_card_v lc ON lc.id = g.item_id
    CROSS JOIN brand_mappings_resolved bmr
    WHERE array_length(v_pref_brands,1) IS NOT NULL
      AND lower(lc.brand) = lower(bmr.db_brand_name)
    LIMIT 300
  ),
  -- Behavior-based brand recommendations (from user's historical interactions)
  cand_behavior_brand AS (
    SELECT DISTINCT g.item_id
    FROM inv_gender g
    JOIN public.listing_card_v lc ON lc.id = g.item_id
    CROSS JOIN user_behavior_brands ubb
    WHERE EXISTS (SELECT 1 FROM user_behavior_brands)  -- Only if user has interaction history
      AND lower(lc.brand) = ubb.brand
      -- Exclude items user has already interacted with
      AND NOT EXISTS (SELECT 1 FROM user_interactions ui WHERE ui.listing_id = g.item_id)
    LIMIT 200
  ),
  -- Expand preferred_styles to tag keywords for matching
  -- Handle compound styles like "90s/Y2K" -> ["90s", "y2k"]
  -- Handle multi-word styles like "Luxury Designer" -> ["luxury", "designer"]
  style_tags_expanded AS (
    SELECT 
      s AS original_style,
      -- Split on "/" first, then on space, then use as-is
      CASE
        WHEN s LIKE '%/%' THEN string_to_array(lower(s), '/')
        WHEN s LIKE '% %' THEN string_to_array(lower(s), ' ')
        ELSE ARRAY[lower(s)]
      END AS keywords
    FROM unnest(v_pref_styles) s
    WHERE array_length(v_pref_styles, 1) IS NOT NULL
  ),
  style_tags AS (
    SELECT DISTINCT trim(keyword) AS tag_keyword
    FROM style_tags_expanded
    CROSS JOIN LATERAL unnest(keywords) AS keyword
    WHERE trim(keyword) != ''
  ),
  cand_tag AS (
    SELECT DISTINCT g.item_id
    FROM inv_gender g
    JOIN public.listings l ON l.id = g.item_id
    CROSS JOIN style_tags st
    WHERE array_length(v_pref_styles,1) IS NOT NULL
      AND (l.tags ?| ARRAY[st.tag_keyword])
    LIMIT 300
  ),
  -- Behavior-based tag recommendations (from user's historical interactions)
  cand_behavior_tag AS (
    SELECT DISTINCT g.item_id
    FROM inv_gender g
    JOIN public.listings l ON l.id = g.item_id
    CROSS JOIN user_behavior_tags ubt
    WHERE EXISTS (SELECT 1 FROM user_behavior_tags)  -- Only if user has interaction history
      AND (l.tags ?| ARRAY[ubt.tag])
      -- Exclude items user has already interacted with
      AND NOT EXISTS (SELECT 1 FROM user_interactions ui WHERE ui.listing_id = g.item_id)
    LIMIT 200
  ),
  cand AS (
    SELECT item_id FROM cand_trending
    UNION
    SELECT item_id FROM cand_brand
    UNION
    SELECT item_id FROM cand_tag
    UNION
    SELECT item_id FROM cand_behavior_brand
    UNION
    SELECT item_id FROM cand_behavior_tag
  ),

  -- Flags + raw scores + promotion metadata
  flags AS (
    SELECT DISTINCT ON (c.item_id)
      c.item_id,
      COALESCE(r.fair_score, 0)::numeric          AS fair_score_raw,
      COALESCE(r.final_score, COALESCE(r.fair_score, 0))::numeric AS boosted_score_raw,
      COALESCE(r.is_boosted, false)               AS is_boosted_flag,
      CASE
        WHEN COALESCE(r.is_boosted, false) THEN COALESCE(r.boost_weight, 1.0)::numeric
        ELSE NULL::numeric
      END                                         AS boost_weight_value,

      EXISTS (
        SELECT 1
        FROM public.listing_card_v lc
        CROSS JOIN brand_mappings_resolved bmr
        WHERE lc.id = c.item_id
          AND array_length(v_pref_brands,1) IS NOT NULL
          AND lower(lc.brand) = lower(bmr.db_brand_name)
      ) AS brand_match,

      -- Count matching tags using expanded style keywords
      COALESCE((
        SELECT COUNT(DISTINCT st.tag_keyword)
        FROM public.listings l
        CROSS JOIN style_tags st
        WHERE l.id = c.item_id
          AND array_length(v_pref_styles,1) IS NOT NULL
          AND (l.tags ?| ARRAY[st.tag_keyword])
      ), 0) AS tag_match_count,
      
      -- Simple tag match flag using expanded style keywords
      EXISTS (
        SELECT 1
        FROM public.listings l
        CROSS JOIN style_tags st
        WHERE l.id = c.item_id
          AND array_length(v_pref_styles,1) IS NOT NULL
          AND (l.tags ?| ARRAY[st.tag_keyword])
      ) AS tag_match,

      (c.item_id IN (SELECT item_id FROM cand_brand)
       OR c.item_id IN (SELECT item_id FROM cand_tag)
       OR c.item_id IN (SELECT item_id FROM cand_behavior_brand)
       OR c.item_id IN (SELECT item_id FROM cand_behavior_tag)) AS engagement_aff,
      
      -- Behavior-based matching flags (similar to brand_match and tag_match but from user behavior)
      EXISTS (
        SELECT 1
        FROM public.listing_card_v lc
        CROSS JOIN user_behavior_brands ubb
        WHERE lc.id = c.item_id
          AND EXISTS (SELECT 1 FROM user_behavior_brands)
          AND lower(lc.brand) = ubb.brand
      ) AS behavior_brand_match,
      EXISTS (
        SELECT 1
        FROM public.listings l
        CROSS JOIN user_behavior_tags ubt
        WHERE l.id = c.item_id
          AND EXISTS (SELECT 1 FROM user_behavior_tags)
          AND (l.tags ?| ARRAY[ubt.tag])
      ) AS behavior_tag_match,
      -- Count behavior tag matches
      COALESCE((
        SELECT COUNT(DISTINCT ubt.tag)
        FROM public.listings l
        CROSS JOIN user_behavior_tags ubt
        WHERE l.id = c.item_id
          AND EXISTS (SELECT 1 FROM user_behavior_tags)
          AND (l.tags ?| ARRAY[ubt.tag])
      ), 0) AS behavior_tag_match_count
    FROM cand c
    LEFT JOIN LATERAL (
      SELECT lr.*
      FROM public.listing_recommendations_with_boost lr
      WHERE lr.listing_id = c.item_id
      ORDER BY lr.final_score DESC
      LIMIT 1
    ) r ON TRUE
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
      CASE
        WHEN s.mx > s.mn THEN
          (COALESCE(f.boosted_score_raw, 0) - s.mn) / NULLIF(s.mx - s.mn, 0)
        ELSE 0
      END AS boost_norm,
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
      sc.brand_match,
      sc.tag_match,
      sc.tag_match_count,
      sc.engagement_aff,
      (
        0.40 * sc.boost_norm
        + 0.30 * CASE WHEN sc.engagement_aff THEN 1 ELSE 0 END
        -- Enhanced preference matching: higher weight for multiple matches and brand+tag combo
        + CASE 
            -- Explicit preferences (user selected brands/styles) have highest priority
            WHEN sc.brand_match AND sc.tag_match THEN 0.35  -- Both brand and tag: highest priority
            WHEN sc.tag_match_count >= 2 THEN 0.32  -- Multiple tag matches: higher priority
            WHEN sc.brand_match OR sc.tag_match THEN 0.28  -- Single match: standard priority
            -- Behavior-based recommendations (from user interactions) have moderate priority
            WHEN sc.behavior_brand_match AND sc.behavior_tag_match THEN 0.25  -- Behavior: brand+tag
            WHEN sc.behavior_tag_match_count >= 2 THEN 0.22  -- Behavior: multiple tags
            WHEN sc.behavior_brand_match OR sc.behavior_tag_match THEN 0.18  -- Behavior: single match
            ELSE 0
          END
      ) AS final_score_val,
      CASE
        WHEN sc.brand_match AND sc.tag_match THEN 'brand&tag'
        WHEN sc.brand_match THEN 'brand'
        WHEN sc.tag_match THEN 'tag'
        WHEN sc.behavior_brand_match AND sc.behavior_tag_match THEN 'behavior_brand&tag'
        WHEN sc.behavior_brand_match THEN 'behavior_brand'
        WHEN sc.behavior_tag_match THEN 'behavior_tag'
        WHEN sc.engagement_aff THEN 'affinity'
        ELSE 'trending'
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
      r.final_score_val,
      lc.title        AS card_title,
      lc.image_url    AS card_image_url,
      lc.price_cents  AS card_price_cents,
      lc.brand        AS card_brand,
      lc.tags         AS card_tags,
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
      card_price_cents::int                  AS card_price_cents_int,
      card_brand,
      card_tags,
      src_label,
      fair_score_raw,
      boosted_score_raw,
      is_boosted_flag,
      boost_weight_value,
      (final_score_val * power(0.85, greatest(brand_rank - 1, 0)))::numeric AS final_score_num
    FROM ranked_page
  ),
  -- Score buckets: group items by score ranges for better randomization
  -- Each bucket contains items with similar scores, allowing seed-based shuffling within buckets
  bucketed AS (
    SELECT
      d.*,
      -- Create score buckets: divide score by 0.15 to create larger buckets
      -- Larger buckets allow more items to be shuffled together, creating more variety
      -- Higher scores get higher bucket numbers (better position)
      floor(d.final_score_num / 0.15)::int AS score_bucket,
      -- Generate a deterministic "random" value based on item_id and seed using hashtext
      -- This creates a consistent but seed-dependent ordering within each bucket
      abs(hashtext(d.item_id::text || v_seed))::numeric AS seed_hash
    FROM decayed d
  )

  SELECT
    b.item_id                              AS id,
    b.card_title                           AS title,
    b.card_image_url                       AS image_url,
    (b.card_price_cents_int)::numeric      AS price_cents,
    b.card_brand                           AS brand,
    b.card_tags                            AS tags,
    b.src_label                            AS source,
    b.fair_score_raw                       AS fair_score,
    b.final_score_num                      AS final_score,
    b.is_boosted_flag                      AS is_boosted,
    CASE WHEN b.is_boosted_flag THEN b.boost_weight_value ELSE NULL::numeric END AS boost_weight
  FROM bucketed b
  ORDER BY
    -- Primary sort: score bucket (higher scores first, so DESC)
    b.score_bucket DESC,
    -- Secondary sort: within each bucket, use seed-based hash for deterministic shuffling
    -- Different seeds will produce different orders while maintaining quality ranking
    b.seed_hash DESC
  LIMIT p_limit
  OFFSET p_offset;

END;
$function$;

