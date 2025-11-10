-- Create premium_subscriptions table to track premium subscription payments and history
CREATE TABLE IF NOT EXISTS premium_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_duration VARCHAR(10) NOT NULL, -- '1m', '3m', '1y'
  paid_amount DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'EXPIRED', 'CANCELLED'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_premium_subscriptions_user_id ON premium_subscriptions(user_id);
CREATE INDEX idx_premium_subscriptions_status ON premium_subscriptions(status);
CREATE INDEX idx_premium_subscriptions_created_at ON premium_subscriptions(created_at DESC);
CREATE INDEX idx_premium_subscriptions_ends_at ON premium_subscriptions(ends_at);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_premium_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_premium_subscriptions_updated_at
  BEFORE UPDATE ON premium_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_premium_subscriptions_updated_at();

-- Trigger to auto-expire premium subscriptions
CREATE OR REPLACE FUNCTION auto_expire_premium_subscriptions()
RETURNS TRIGGER AS $$
BEGIN
  -- When a subscription ends_at passes current time, mark as EXPIRED
  IF NEW.ends_at <= NOW() AND NEW.status = 'ACTIVE' THEN
    NEW.status = 'EXPIRED';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_expire_premium_subscriptions
  BEFORE UPDATE ON premium_subscriptions
  FOR EACH ROW
  WHEN (NEW.ends_at <= NOW() AND NEW.status = 'ACTIVE')
  EXECUTE FUNCTION auto_expire_premium_subscriptions();
