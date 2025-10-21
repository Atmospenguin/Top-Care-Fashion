-- Alter landing_content to add configurable images and feature texts
ALTER TABLE landing_content
  ADD COLUMN IF NOT EXISTS hero_carousel_images JSONB,
  ADD COLUMN IF NOT EXISTS mixmatch_title VARCHAR(100),
  ADD COLUMN IF NOT EXISTS mixmatch_desc VARCHAR(300),
  ADD COLUMN IF NOT EXISTS mixmatch_girl_images JSONB,
  ADD COLUMN IF NOT EXISTS mixmatch_boy_images JSONB,
  ADD COLUMN IF NOT EXISTS ailisting_title VARCHAR(100),
  ADD COLUMN IF NOT EXISTS ailisting_desc VARCHAR(300),
  ADD COLUMN IF NOT EXISTS ailisting_images JSONB,
  ADD COLUMN IF NOT EXISTS search_title VARCHAR(100),
  ADD COLUMN IF NOT EXISTS search_desc VARCHAR(300),
  ADD COLUMN IF NOT EXISTS search_images JSONB;
