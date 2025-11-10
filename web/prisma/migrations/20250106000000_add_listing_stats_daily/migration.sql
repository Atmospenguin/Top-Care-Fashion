CREATE TABLE IF NOT EXISTS "public"."listing_stats_daily" (
  "id" SERIAL PRIMARY KEY,
  "listing_id" INTEGER NOT NULL,
  "date" DATE NOT NULL,
  "views" INTEGER NOT NULL DEFAULT 0,
  "likes" INTEGER NOT NULL DEFAULT 0,
  "clicks" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "listing_stats_daily_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings" ("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_listing_stats_daily_listing_date" ON "public"."listing_stats_daily" ("listing_id", "date");
CREATE INDEX IF NOT EXISTS "idx_listing_stats_daily_listing_id" ON "public"."listing_stats_daily" ("listing_id");
CREATE INDEX IF NOT EXISTS "idx_listing_stats_daily_date" ON "public"."listing_stats_daily" ("date");

