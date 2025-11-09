-- Update get_feed_v2 to incorporate boost weighting and surface promotion metadata
CREATE OR REPLACE FUNCTION public.get_feed_v2(
  p_supabase_user_id uuid,
  p_mode text,
  p_limit integer,
  p_offset integer,
  p_seed integer,
  p_gender text
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
  v_gender_norm text;
  v_pref_styles text[];
  v_pref_brands text[];
  v_seed text;
BEGIN
  PERFORM set_config('statement_timeout','30000', true);

  v_seed := COALESCE(p_seed, 0)::text;
  v_gender_norm := lower(COALESCE(p_gender, 'unisex'));

  -- Resolve app user + prefs
  SELECT
    u.id,
    COALESCE(array(SELECT jsonb_array_elements_text(u.preferred_styles)), '{}'::text[]),
    COALESCE(array(SELECT jsonb_array_elements_text(u.preferred_brands)), '{}'::text[])
  INTO v_user_id, v_pref_styles, v_pref_brands
  FROM public.users u
  WHERE u.supabase_user_id = p_supabase_user_id;

  IF v_user_id IS NULL THEN
    RETURN;
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

  -- Candidate pools
  cand_trending AS (
    SELECT r.listing_id AS item_id
    FROM public.listing_recommendations_with_boost r
    JOIN inv_gender g ON g.item_id = r.listing_id
    ORDER BY r.final_score DESC
    LIMIT 300
  ),
  cand_brand AS (
    SELECT g.item_id
    FROM inv_gender g
    JOIN public.listing_card_v lc ON lc.id = g.item_id
    WHERE array_length(v_pref_brands,1) IS NOT NULL
      AND lower(lc.brand) = ANY (SELECT lower(b) FROM unnest(v_pref_brands) b)
    LIMIT 300
  ),
  cand_tag AS (
    SELECT g.item_id
    FROM inv_gender g
    JOIN public.listings l ON l.id = g.item_id
    WHERE array_length(v_pref_styles,1) IS NOT NULL
      AND (l.tags ?| (SELECT array_agg(lower(s)) FROM unnest(v_pref_styles) s))
    LIMIT 300
  ),
  cand AS (
    SELECT item_id FROM cand_trending
    UNION
    SELECT item_id FROM cand_brand
    UNION
    SELECT item_id FROM cand_tag
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
        WHERE lc.id = c.item_id
          AND array_length(v_pref_brands,1) IS NOT NULL
          AND lower(lc.brand) = ANY (SELECT lower(b) FROM unnest(v_pref_brands) b)
      ) AS brand_match,

      EXISTS (
        SELECT 1
        FROM public.listings l
        WHERE l.id = c.item_id
          AND array_length(v_pref_styles,1) IS NOT NULL
          AND (l.tags ?| (SELECT array_agg(lower(s)) FROM unnest(v_pref_styles) s))
      ) AS tag_match,

      (c.item_id IN (SELECT item_id FROM cand_brand)
       OR c.item_id IN (SELECT item_id FROM cand_tag)) AS engagement_aff
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
      f.engagement_aff
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
      sc.engagement_aff,
      (
        0.55 * sc.boost_norm
        + 0.25 * CASE WHEN sc.engagement_aff THEN 1 ELSE 0 END
        + 0.20 * CASE WHEN (sc.brand_match OR sc.tag_match) THEN 1 ELSE 0 END
      ) AS final_score_val,
      CASE
        WHEN sc.brand_match AND sc.tag_match THEN 'brand&tag'
        WHEN sc.brand_match THEN 'brand'
        WHEN sc.tag_match  THEN 'tag'
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
  )

  SELECT
    d.item_id                              AS id,
    d.card_title                           AS title,
    d.card_image_url                       AS image_url,
    (d.card_price_cents_int)::numeric      AS price_cents,
    d.card_brand                           AS brand,
    d.card_tags                            AS tags,
    d.src_label                            AS source,
    d.fair_score_raw                       AS fair_score,
    d.final_score_num                      AS final_score,
    d.is_boosted_flag                      AS is_boosted,
    CASE WHEN d.is_boosted_flag THEN d.boost_weight_value ELSE NULL::numeric END AS boost_weight
  FROM decayed d
  ORDER BY
    d.final_score_num DESC,
    md5(d.item_id::text || v_seed)
  LIMIT p_limit
  OFFSET p_offset;

END;
$function$;

