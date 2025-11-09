-- Add boost_weight field to listing_promotions table
-- This field controls the boost strength in feed ranking (separate from performance metrics)
ALTER TABLE listing_promotions ADD COLUMN boost_weight DECIMAL(4, 2) DEFAULT 1.50;

COMMENT ON COLUMN listing_promotions.boost_weight IS 'Multiplier for feed ranking (e.g., 1.50 = 50% boost, 2.00 = 100% boost)';

-- Create view that combines recommendations with active boost information
CREATE OR REPLACE VIEW listing_recommendations_with_boost AS
SELECT
  lr.listing_id,
  lr.fair_score,
  lp.id as promotion_id,
  lp.boost_weight,
  lp.view_uplift_percent,
  lp.click_uplift_percent,
  lp.status AS promotion_status,
  lp.started_at AS promotion_started_at,
  lp.ends_at AS promotion_ends_at,
  -- Calculate final score with boost applied
  CASE
    WHEN lp.status = 'ACTIVE' AND lp.ends_at > NOW() THEN
      lr.fair_score * COALESCE(lp.boost_weight, 1.0)
    ELSE
      lr.fair_score
  END AS final_score,
  -- Flag if item is currently boosted
  CASE
    WHEN lp.status = 'ACTIVE' AND lp.ends_at > NOW() THEN true
    ELSE false
  END AS is_boosted
FROM listing_recommendations_main_fair lr
LEFT JOIN listing_promotions lp
  ON lr.listing_id = lp.listing_id
  AND lp.status = 'ACTIVE'
  AND lp.ends_at > NOW();

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_listing_promotions_active_boosted
  ON listing_promotions(listing_id, status, ends_at)
  WHERE status = 'ACTIVE';

COMMENT ON VIEW listing_recommendations_with_boost IS 'Combines listing recommendations with active boost data for feed ranking';
