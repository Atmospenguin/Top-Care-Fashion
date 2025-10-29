-- Allow unlimited landing page feature cards stored as JSON array
ALTER TABLE landing_content
  ADD COLUMN IF NOT EXISTS feature_cards JSONB;
