-- Add quantity column to orders table for tracking purchased amounts
ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "quantity" INTEGER DEFAULT 1;

-- Backfill existing records to ensure no NULL values
UPDATE "orders"
SET "quantity" = 1
WHERE "quantity" IS NULL;


