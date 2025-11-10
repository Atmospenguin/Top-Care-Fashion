-- Migration: Prevent direct updates to users.is_premium and users.premium_until
-- These fields should only be updated via premium_subscriptions table triggers

-- Step 1: Create function to prevent or override direct premium field updates
CREATE OR REPLACE FUNCTION enforce_premium_subscription_sync()
RETURNS TRIGGER AS $$
DECLARE
  active_subscription_count INT;
  latest_subscription_ends_at TIMESTAMPTZ;
BEGIN
  -- If is_premium or premium_until is being changed, recalculate from premium_subscriptions
  IF (OLD.is_premium IS DISTINCT FROM NEW.is_premium) OR 
     (OLD.premium_until IS DISTINCT FROM NEW.premium_until) THEN
    
    -- Recalculate from premium_subscriptions table (source of truth)
    SELECT COUNT(*), MAX(ends_at)
    INTO active_subscription_count, latest_subscription_ends_at
    FROM premium_subscriptions
    WHERE user_id = NEW.id
      AND status = 'ACTIVE'
      AND ends_at > NOW();

    -- Override the manual change with the correct values from premium_subscriptions
    IF active_subscription_count > 0 THEN
      NEW.is_premium := true;
      NEW.premium_until := latest_subscription_ends_at;
    ELSE
      -- Check if there are any future subscriptions
      SELECT COUNT(*)
      INTO active_subscription_count
      FROM premium_subscriptions
      WHERE user_id = NEW.id
        AND ends_at > NOW();

      IF active_subscription_count = 0 THEN
        NEW.is_premium := false;
        NEW.premium_until := NULL;
      ELSE
        -- Keep existing values if there are future subscriptions but not active yet
        -- This handles edge cases like scheduled subscriptions
        NEW.is_premium := OLD.is_premium;
        NEW.premium_until := OLD.premium_until;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create trigger to enforce premium field sync
DROP TRIGGER IF EXISTS trigger_enforce_premium_subscription_sync ON users;
CREATE TRIGGER trigger_enforce_premium_subscription_sync
  BEFORE UPDATE ON users
  FOR EACH ROW
  WHEN (
    OLD.is_premium IS DISTINCT FROM NEW.is_premium OR
    OLD.premium_until IS DISTINCT FROM NEW.premium_until
  )
  EXECUTE FUNCTION enforce_premium_subscription_sync();

-- Step 3: Add comment
COMMENT ON FUNCTION enforce_premium_subscription_sync() IS
  'Enforces that users.is_premium and users.premium_until are always synced from premium_subscriptions table. Overrides any direct updates to these fields.';

COMMENT ON TRIGGER trigger_enforce_premium_subscription_sync ON users IS
  'Prevents direct modification of premium fields. Always recalculates from premium_subscriptions table.';

-- Step 4: Create helper function for admin to grant premium (creates subscription instead of direct update)
CREATE OR REPLACE FUNCTION admin_grant_premium(
  p_user_id INT,
  p_months INT,
  p_paid_amount DECIMAL DEFAULT 0.00
)
RETURNS INT AS $$
DECLARE
  v_subscription_id INT;
  v_start_date TIMESTAMPTZ;
  v_end_date TIMESTAMPTZ;
  v_plan_duration VARCHAR(10);
BEGIN
  -- Determine plan duration
  IF p_months <= 1 THEN
    v_plan_duration := '1m';
  ELSIF p_months <= 3 THEN
    v_plan_duration := '3m';
  ELSE
    v_plan_duration := '1y';
  END IF;

  v_start_date := NOW();
  v_end_date := v_start_date + (p_months || ' months')::INTERVAL;

  -- Create subscription record
  INSERT INTO premium_subscriptions (
    user_id,
    plan_duration,
    paid_amount,
    started_at,
    ends_at,
    status
  )
  VALUES (
    p_user_id,
    v_plan_duration,
    p_paid_amount,
    v_start_date,
    v_end_date,
    'ACTIVE'
  )
  RETURNING id INTO v_subscription_id;

  -- Trigger will automatically update users.is_premium and users.premium_until
  RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION admin_grant_premium(INT, INT, DECIMAL) IS
  'Helper function for admins to grant premium status. Creates a subscription record instead of directly updating users table.';

