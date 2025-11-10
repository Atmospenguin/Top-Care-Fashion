-- Add paid_amount field to listing_promotions table
-- This tracks the actual amount paid for each promotion
-- $0.00 means used free credit
-- Premium: $2.00/3days with 3 free per month
-- Free: $2.90/3days

ALTER TABLE listing_promotions
ADD COLUMN paid_amount DECIMAL(6, 2) DEFAULT 0.00;

-- Update existing records:
-- - Set $0 for records with used_free_credit = true
-- - Set appropriate price for paid promotions based on seller's premium status at creation time
UPDATE listing_promotions lp
SET paid_amount = CASE
  WHEN lp.used_free_credit = true THEN 0.00
  ELSE (
    SELECT CASE
      WHEN u.is_premium = true AND (u.premium_until IS NULL OR u.premium_until > lp.created_at)
      THEN 2.00  -- Premium price
      ELSE 2.90  -- Free tier price
    END
    FROM users u
    WHERE u.id = lp.seller_id
  )
END;

-- Add index for revenue queries
CREATE INDEX idx_listing_promotions_paid_amount ON listing_promotions(paid_amount) WHERE paid_amount > 0;
