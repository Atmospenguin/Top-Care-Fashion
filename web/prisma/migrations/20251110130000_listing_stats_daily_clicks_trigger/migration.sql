-- Aggregate clicks into listing_stats_daily on each new click event
-- Function: increment_daily_clicks
CREATE OR REPLACE FUNCTION public.increment_daily_clicks()
RETURNS TRIGGER AS $$
DECLARE
  day DATE;
BEGIN
  -- Normalize to date (UTC). clicked_at is timestamptz.
  day := (NEW.clicked_at AT TIME ZONE 'UTC')::date;

  INSERT INTO public.listing_stats_daily (listing_id, date, views, likes, clicks, created_at, updated_at)
  VALUES (NEW.listing_id, day, 0, 0, 1, NOW(), NOW())
  ON CONFLICT (listing_id, date)
  DO UPDATE SET
    clicks = public.listing_stats_daily.clicks + 1,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any (idempotent)
DROP TRIGGER IF EXISTS trg_listing_clicks_daily_agg ON public.listing_clicks;

-- Trigger: AFTER INSERT on listing_clicks
CREATE TRIGGER trg_listing_clicks_daily_agg
AFTER INSERT ON public.listing_clicks
FOR EACH ROW
EXECUTE FUNCTION public.increment_daily_clicks();

COMMENT ON FUNCTION public.increment_daily_clicks() IS 'Aggregates listing_clicks rows into listing_stats_daily per (listing_id, date).';
COMMENT ON TRIGGER trg_listing_clicks_daily_agg ON public.listing_clicks IS 'After-insert aggregation of clicks into listing_stats_daily.';


