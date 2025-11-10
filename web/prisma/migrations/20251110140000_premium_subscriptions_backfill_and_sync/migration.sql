-- Migration: Backfill premium_subscriptions and add sync triggers
-- This migration:
-- 1. Backfills premium_subscriptions from users table (is_premium=true users)
-- 2. Adds triggers to sync users.is_premium and users.premium_until with premium_subscriptions

-- Step 1: Backfill premium_subscriptions from users table
-- For users with is_premium=true, create subscription records
WITH user_subscriptions AS (
  SELECT
    u.id AS user_id,
    u.is_premium,
    u.premium_until,
    u.created_at AS user_created_at,
    -- Calculate duration in months
    EXTRACT(EPOCH FROM (u.premium_until - u.created_at)) / (30 * 24 * 60 * 60) AS duration_months,
    -- Infer plan_duration from premium_until - created_at difference
    CASE
      WHEN EXTRACT(EPOCH FROM (u.premium_until - u.created_at)) / (30 * 24 * 60 * 60) <= 2 THEN '1m'
      WHEN EXTRACT(EPOCH FROM (u.premium_until - u.created_at)) / (30 * 24 * 60 * 60) <= 4 THEN '3m'
      ELSE '1y'
    END AS plan_duration,
    -- Estimate paid_amount based on plan_duration (use correct prices from Plans & Pricing.md)
    CASE
      WHEN EXTRACT(EPOCH FROM (u.premium_until - u.created_at)) / (30 * 24 * 60 * 60) <= 2 THEN 6.90
      WHEN EXTRACT(EPOCH FROM (u.premium_until - u.created_at)) / (30 * 24 * 60 * 60) <= 4 THEN 18.90
      ELSE 59.90
    END AS paid_amount,
    -- Calculate started_at: use premium_until - estimated duration
    CASE
      WHEN EXTRACT(EPOCH FROM (u.premium_until - u.created_at)) / (30 * 24 * 60 * 60) <= 2 
        THEN u.premium_until - INTERVAL '1 month'
      WHEN EXTRACT(EPOCH FROM (u.premium_until - u.created_at)) / (30 * 24 * 60 * 60) <= 4 
        THEN u.premium_until - INTERVAL '3 months'
      ELSE u.premium_until - INTERVAL '1 year'
    END AS started_at,
    -- Set status based on premium_until date
    CASE
      WHEN u.premium_until > NOW() THEN 'ACTIVE'
      ELSE 'EXPIRED'
    END AS status
  FROM users u
  WHERE u.is_premium = true
    AND u.premium_until IS NOT NULL
    AND NOT EXISTS (
      -- Avoid duplicates: only insert if no subscription exists for this user
      SELECT 1 FROM premium_subscriptions ps
      WHERE ps.user_id = u.id
    )
)
INSERT INTO premium_subscriptions (user_id, plan_duration, paid_amount, started_at, ends_at, status, created_at, updated_at)
SELECT
  user_id,
  plan_duration,
  paid_amount,
  GREATEST(started_at, user_created_at) AS started_at,
  premium_until AS ends_at,
  status,
  user_created_at AS created_at,
  NOW() AS updated_at
FROM user_subscriptions;

-- Step 2: Create function to sync users table when premium_subscriptions change
CREATE OR REPLACE FUNCTION sync_users_premium_status()
RETURNS TRIGGER AS $$
DECLARE
  active_subscription_count INT;
  latest_subscription_ends_at TIMESTAMPTZ;
BEGIN
  -- Count active subscriptions for this user
  SELECT COUNT(*), MAX(ends_at)
  INTO active_subscription_count, latest_subscription_ends_at
  FROM premium_subscriptions
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    AND status = 'ACTIVE'
    AND ends_at > NOW();

  -- Update users table based on subscription status
  IF active_subscription_count > 0 THEN
    -- User has active subscription
    UPDATE users
    SET
      is_premium = true,
      premium_until = latest_subscription_ends_at,
      updated_at = NOW()
    WHERE id = COALESCE(NEW.user_id, OLD.user_id);
  ELSE
    -- No active subscriptions, check if user should be marked as non-premium
    -- Only update if there are no future subscriptions at all
    SELECT COUNT(*)
    INTO active_subscription_count
    FROM premium_subscriptions
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
      AND ends_at > NOW();

    IF active_subscription_count = 0 THEN
      -- No active or future subscriptions, mark as non-premium
      UPDATE users
      SET
        is_premium = false,
        premium_until = NULL,
        updated_at = NOW()
      WHERE id = COALESCE(NEW.user_id, OLD.user_id);
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create triggers for INSERT, UPDATE, DELETE on premium_subscriptions
DROP TRIGGER IF EXISTS trigger_sync_users_premium_on_insert ON premium_subscriptions;
CREATE TRIGGER trigger_sync_users_premium_on_insert
  AFTER INSERT ON premium_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_users_premium_status();

DROP TRIGGER IF EXISTS trigger_sync_users_premium_on_update ON premium_subscriptions;
CREATE TRIGGER trigger_sync_users_premium_on_update
  AFTER UPDATE ON premium_subscriptions
  FOR EACH ROW
  WHEN (
    OLD.status IS DISTINCT FROM NEW.status OR
    OLD.ends_at IS DISTINCT FROM NEW.ends_at OR
    OLD.user_id IS DISTINCT FROM NEW.user_id
  )
  EXECUTE FUNCTION sync_users_premium_status();

DROP TRIGGER IF EXISTS trigger_sync_users_premium_on_delete ON premium_subscriptions;
CREATE TRIGGER trigger_sync_users_premium_on_delete
  AFTER DELETE ON premium_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_users_premium_status();

-- Step 4: Add comment
COMMENT ON FUNCTION sync_users_premium_status() IS
  'Syncs users.is_premium and users.premium_until with premium_subscriptions table. Updates users table whenever subscriptions are created, updated, or deleted.';

-- Step 5: Create a function to periodically check and expire subscriptions
-- This can be called by a cron job or scheduled task
CREATE OR REPLACE FUNCTION expire_premium_subscriptions()
RETURNS INT AS $$
DECLARE
  expired_count INT;
BEGIN
  -- Mark subscriptions as EXPIRED if ends_at has passed
  WITH expired_subs AS (
    UPDATE premium_subscriptions
    SET status = 'EXPIRED', updated_at = NOW()
    WHERE status = 'ACTIVE'
      AND ends_at <= NOW()
    RETURNING user_id
  )
  SELECT COUNT(*) INTO expired_count
  FROM expired_subs;

  -- Sync users table for users with expired subscriptions
  -- This will automatically trigger sync_users_premium_status() via the update trigger
  -- But we also manually sync all users who might be affected
  WITH user_status AS (
    SELECT
      u.id AS user_id,
      COALESCE(MAX(ps.ends_at) FILTER (WHERE ps.status = 'ACTIVE' AND ps.ends_at > NOW()), NULL) AS latest_ends_at,
      MAX(ps.ends_at) FILTER (WHERE ps.status = 'ACTIVE' AND ps.ends_at > NOW()) IS NOT NULL AS has_active
    FROM users u
    LEFT JOIN premium_subscriptions ps ON ps.user_id = u.id
    WHERE u.is_premium = true
    GROUP BY u.id
  )
  UPDATE users u
  SET
    is_premium = us.has_active,
    premium_until = us.latest_ends_at,
    updated_at = NOW()
  FROM user_status us
  WHERE u.id = us.user_id
    AND (
      u.is_premium != us.has_active
      OR u.premium_until IS DISTINCT FROM us.latest_ends_at
    );

  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION expire_premium_subscriptions() IS
  'Marks expired subscriptions and syncs users table. Should be called periodically (e.g., daily via cron).';

