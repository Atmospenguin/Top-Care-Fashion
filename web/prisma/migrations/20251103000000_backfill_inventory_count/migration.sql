-- Backfill inventory_count for existing listings
-- Set default inventory to 1 for all unsold and listed items that have 0 or NULL inventory

UPDATE "listings"
SET "inventory_count" = 1
WHERE ("inventory_count" IS NULL OR "inventory_count" = 0)
  AND "sold" = false
  AND "listed" = true;

