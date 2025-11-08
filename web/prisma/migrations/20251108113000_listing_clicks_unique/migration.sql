CREATE UNIQUE INDEX IF NOT EXISTS "idx_listing_clicks_user_bucket_unique"
ON "public"."listing_clicks" ("listing_id", "user_id", "bucket_10s")
WHERE "user_id" IS NOT NULL AND "bucket_10s" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "idx_listing_clicks_anon_bucket_unique"
ON "public"."listing_clicks" ("listing_id", "bucket_10s")
WHERE "user_id" IS NULL AND "bucket_10s" IS NOT NULL;

