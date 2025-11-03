-- Backfill inventory_count for existing listings
-- This script sets default inventory to 1 for all unsold and listed items that have 0 or NULL inventory
-- Execute this in Supabase SQL Editor

UPDATE "listings"
SET "inventory_count" = 1
WHERE ("inventory_count" IS NULL OR "inventory_count" = 0)
  AND "sold" = false
  AND "listed" = true;

-- Check the results
SELECT 
  id,
  name,
  inventory_count,
  sold,
  listed
FROM "listings"
WHERE "inventory_count" = 1
  AND "sold" = false
  AND "listed" = true
ORDER BY created_at DESC
LIMIT 20;

