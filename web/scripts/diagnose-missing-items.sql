-- Diagnostic query to check why items 64, 71, 486 are missing
-- Run this in Supabase SQL editor to see detailed information

-- Set user context
DO $$
DECLARE
  v_user_id int := 1;
  v_supabase_user_id uuid;
  v_pref_styles text[];
  v_pref_brands text[];
  v_search_query text := 'nike';
BEGIN
  -- Get user data
  SELECT supabase_user_id, 
         COALESCE(array(SELECT jsonb_array_elements_text(preferred_styles)), '{}'::text[]),
         COALESCE(array(SELECT jsonb_array_elements_text(preferred_brands)), '{}'::text[])
  INTO v_supabase_user_id, v_pref_styles, v_pref_brands
  FROM public.users
  WHERE id = v_user_id;

  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Supabase User ID: %', v_supabase_user_id;
  RAISE NOTICE 'Preferred Styles: %', v_pref_styles;
  RAISE NOTICE 'Preferred Brands: %', v_pref_brands;
END $$;

-- Check if items are in cand_search
SELECT 
  l.id,
  l.name,
  CASE WHEN cs.item_id IS NOT NULL THEN 'IN_CAND_SEARCH' ELSE 'NOT_IN_CAND_SEARCH' END as in_cand_search
FROM public.listings l
LEFT JOIN (
  SELECT DISTINCT g.item_id
  FROM (
    SELECT l.id AS item_id
    FROM public.listings l
    WHERE l.listed = true
      AND l.sold = false
      AND (
        lower(l.name) LIKE '%nike%'
        OR lower(COALESCE(l.description, '')) LIKE '%nike%'
        OR lower(COALESCE(l.brand, '')) LIKE '%nike%'
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(l.tags) AS tag
          WHERE lower(tag) LIKE '%nike%'
        )
      )
  ) g
  LIMIT 500
) cs ON cs.item_id = l.id
WHERE l.id IN (64, 71, 486);

-- Check fair_score for these items
SELECT 
  l.id,
  l.name,
  lr.fair_score,
  lr.final_score,
  lr.is_boosted
FROM public.listings l
LEFT JOIN public.listing_recommendations_with_boost lr ON lr.listing_id = l.id
WHERE l.id IN (64, 71, 486);

-- Check if items appear in final results WITHOUT user
SELECT 
  id,
  title,
  final_score,
  source
FROM get_search_feed(
  null,
  'Nike',
  1000,
  0,
  832907322,
  null,
  null
)
WHERE id IN (64, 71, 486)
ORDER BY final_score DESC;

-- Check if items appear in final results WITH user ID 1
SELECT 
  id,
  title,
  final_score,
  source,
  fair_score,
  search_relevance
FROM get_search_feed(
  '0037968f-3ebd-489e-a667-e8f21f5e204f'::uuid,
  'Nike',
  1000,
  0,
  832907322,
  null,
  null
)
WHERE id IN (64, 71, 486)
ORDER BY final_score DESC;

