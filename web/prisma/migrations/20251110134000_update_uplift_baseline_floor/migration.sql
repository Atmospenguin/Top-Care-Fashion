-- Update calculate_promotion_uplift to floor baseline metrics at minimum values
CREATE OR REPLACE FUNCTION public.calculate_promotion_uplift()
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
  IF OLD.views = NEW.views AND OLD.clicks = NEW.clicks THEN
    RETURN NEW;
  END IF;

  boost_start := NEW.started_at::DATE;
  boost_end := COALESCE(NEW.ends_at::DATE, CURRENT_DATE);
  boost_days := boost_end - boost_start + 1;

  IF boost_days < 1 THEN
    boost_days := 1;
  END IF;

  baseline_start := boost_start - boost_days;
  baseline_end := boost_start - 1;

  SELECT
    COALESCE(SUM(views), 0)::DECIMAL,
    COALESCE(SUM(clicks), 0)::DECIMAL
  INTO baseline_views, baseline_clicks
  FROM listing_stats_daily
  WHERE listing_id = NEW.listing_id
    AND date >= baseline_start
    AND date <= baseline_end;

  -- Ensure baseline floors
  IF baseline_views < boost_days THEN
    baseline_views := boost_days;
  END IF;

  IF baseline_clicks < 0 THEN
    baseline_clicks := 0;
  END IF;

  view_uplift := 0;
  click_uplift := 0;

  boost_daily_views := 0;
  baseline_daily_views := 1;

  IF NEW.views > 0 THEN
    boost_daily_views := NEW.views::DECIMAL / boost_days;
  END IF;

  baseline_daily_views := baseline_views / boost_days;

  IF baseline_daily_views < 1 THEN
    baseline_daily_views := 1;
    baseline_views := baseline_daily_views * boost_days;
  END IF;

  IF baseline_views <= 0 THEN
    baseline_views := boost_days;
  END IF;

  IF baseline_daily_views > 0 AND NEW.views > 0 THEN
    view_uplift := ROUND(
      ((boost_daily_views - baseline_daily_views) / baseline_daily_views) * 100
    )::INT;

    IF view_uplift > 999 THEN
      view_uplift := 999;
    ELSIF view_uplift < -99 THEN
      view_uplift := -99;
    END IF;
  END IF;

  boost_ctr := 0;
  baseline_ctr := 0;

  IF NEW.views > 0 THEN
    boost_ctr := (NEW.clicks::DECIMAL / NEW.views) * 100;
  END IF;

  IF baseline_views > 0 THEN
    baseline_ctr := (baseline_clicks / baseline_views) * 100;
  END IF;

  IF baseline_ctr <= 0 AND baseline_clicks > 0 THEN
    baseline_ctr := 1;
  END IF;

  IF baseline_ctr > 0 AND NEW.views > 0 THEN
    click_uplift := ROUND(
      ((boost_ctr - baseline_ctr) / baseline_ctr) * 100
    )::INT;

    IF click_uplift > 999 THEN
      click_uplift := 999;
    ELSIF click_uplift < -99 THEN
      click_uplift := -99;
    END IF;
  END IF;

  NEW.view_uplift_percent := view_uplift;
  NEW.click_uplift_percent := click_uplift;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.calculate_promotion_uplift() IS
  'Automatically calculates view and click uplift percentages with baseline floors to avoid zero denominators.';


