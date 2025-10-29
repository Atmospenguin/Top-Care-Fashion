-- Add images column to reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS images JSONB;
ALTER TABLE reviews ALTER COLUMN comment DROP NOT NULL;

