DO $$
BEGIN
  CREATE TYPE "PromotionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'SCHEDULED');
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

CREATE TABLE IF NOT EXISTS "public"."listing_promotions" (
  "id" SERIAL PRIMARY KEY,
  "listing_id" INTEGER NOT NULL,
  "seller_id" INTEGER NOT NULL,
  "status" "PromotionStatus" NOT NULL DEFAULT 'ACTIVE',
  "started_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "ends_at" TIMESTAMPTZ,
  "views" INTEGER NOT NULL DEFAULT 0,
  "clicks" INTEGER NOT NULL DEFAULT 0,
  "view_uplift_percent" INTEGER NOT NULL DEFAULT 0,
  "click_uplift_percent" INTEGER NOT NULL DEFAULT 0,
  "used_free_credit" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "listing_promotions_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings" ("id") ON DELETE CASCADE,
  CONSTRAINT "listing_promotions_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_listing_promotions_seller_id" ON "public"."listing_promotions" ("seller_id");
CREATE INDEX IF NOT EXISTS "idx_listing_promotions_listing_id" ON "public"."listing_promotions" ("listing_id");
CREATE INDEX IF NOT EXISTS "idx_listing_promotions_status" ON "public"."listing_promotions" ("status");
