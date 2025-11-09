-- Migration: Add automatic uplift calculation trigger
-- This trigger automatically calculates view_uplift_percent and click_uplift_percent
-- whenever views or clicks are updated on listing_promotions table

-- Function to calculate promotion uplift
CREATE OR REPLACE FUNCTION calculate_promotion_uplift()
RETURNS TRIGGER AS $$
DECLARE
  boost_start DATE;
  boost_end DATE;
  boost_days INT;
  baseline_start DATE;
  baseline_end DATE;

  baseline_views DECIMAL;
  baseline_clicks DECIMAL;

  boost_daily_views DECIMAL;
  baseline_daily_views DECIMAL;
  boost_ctr DECIMAL;
  baseline_ctr DECIMAL;

  view_uplift INT;
  click_uplift INT;
BEGIN
  -- Only calculate if views or clicks changed
  IF OLD.views = NEW.views AND OLD.clicks = NEW.clicks THEN
    RETURN NEW;
  END IF;

  -- Get boost period dates
  boost_start := NEW.started_at::DATE;
  boost_end := COALESCE(NEW.ends_at::DATE, CURRENT_DATE);
  boost_days := boost_end - boost_start + 1;

  -- Minimum 1 day for calculation
  IF boost_days < 1 THEN
    boost_days := 1;
  END IF;

  -- Calculate baseline period (same duration before boost)
  baseline_start := boost_start - boost_days;
  baseline_end := boost_start - 1;

  -- Get baseline metrics from listing_stats_daily
  SELECT
    COALESCE(SUM(views), 0)::DECIMAL,
    COALESCE(SUM(clicks), 0)::DECIMAL
  INTO baseline_views, baseline_clicks
  FROM listing_stats_daily
  WHERE listing_id = NEW.listing_id
    AND date >= baseline_start
    AND date <= baseline_end;

  -- Initialize
  view_uplift := 0;
  click_uplift := 0;

  -- Calculate view uplift (daily average comparison)
  IF baseline_views > 0 AND NEW.views > 0 THEN
    boost_daily_views := NEW.views::DECIMAL / boost_days;
    baseline_daily_views := baseline_views / boost_days;

    IF baseline_daily_views > 0 THEN
      view_uplift := ROUND(
        ((boost_daily_views - baseline_daily_views) / baseline_daily_views) * 100
      )::INT;

      -- Cap at reasonable limits
      IF view_uplift > 999 THEN
        view_uplift := 999;
      ELSIF view_uplift < -99 THEN
        view_uplift := -99;
      END IF;
    END IF;
  END IF;

  -- Calculate click uplift (CTR comparison)
  IF NEW.views > 0 AND baseline_views > 0 THEN
    boost_ctr := (NEW.clicks::DECIMAL / NEW.views) * 100;
    baseline_ctr := (baseline_clicks / baseline_views) * 100;

    IF baseline_ctr > 0 THEN
      click_uplift := ROUND(
        ((boost_ctr - baseline_ctr) / baseline_ctr) * 100
      )::INT;

      -- Cap at reasonable limits
      IF click_uplift > 999 THEN
        click_uplift := 999;
      ELSIF click_uplift < -99 THEN
        click_uplift := -99;
      END IF;
    END IF;
  END IF;

  -- Update uplift values
  NEW.view_uplift_percent := view_uplift;
  NEW.click_uplift_percent := click_uplift;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_calculate_promotion_uplift ON listing_promotions;

-- Create trigger
CREATE TRIGGER trigger_calculate_promotion_uplift
  BEFORE UPDATE OF views, clicks ON listing_promotions
  FOR EACH ROW
  WHEN (OLD.views IS DISTINCT FROM NEW.views OR OLD.clicks IS DISTINCT FROM NEW.clicks)
  EXECUTE FUNCTION calculate_promotion_uplift();

-- Add index for better performance on baseline queries
CREATE INDEX IF NOT EXISTS idx_listing_stats_daily_lookup
  ON listing_stats_daily (listing_id, date);

-- Add comment
COMMENT ON FUNCTION calculate_promotion_uplift() IS
  'Automatically calculates view and click uplift percentages by comparing boost period performance to baseline (pre-boost) period';

COMMENT ON TRIGGER trigger_calculate_promotion_uplift ON listing_promotions IS
  'Triggers uplift calculation whenever views or clicks are updated';
