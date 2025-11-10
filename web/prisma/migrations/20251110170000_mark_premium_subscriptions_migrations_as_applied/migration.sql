-- Mark migrations that were applied via Supabase MCP as completed in Prisma migrations table
-- These migrations were already applied directly to the database, so we just need to record them

-- Migration 1: 20251110140000_premium_subscriptions_backfill_and_sync
INSERT INTO _prisma_migrations (
  id,
  checksum,
  finished_at,
  migration_name,
  logs,
  rolled_back_at,
  started_at,
  applied_steps_count
)
SELECT 
  gen_random_uuid()::text,
  'e099ab12a71d547273406b291200acfe310466d649892cc533bd56db0b54282d',
  NOW(),
  '20251110140000_premium_subscriptions_backfill_and_sync',
  NULL,
  NULL,
  NOW(),
  1
WHERE NOT EXISTS (
  SELECT 1 FROM _prisma_migrations 
  WHERE migration_name = '20251110140000_premium_subscriptions_backfill_and_sync'
);

-- Migration 2: 20251110150000_prevent_direct_users_premium_updates
INSERT INTO _prisma_migrations (
  id,
  checksum,
  finished_at,
  migration_name,
  logs,
  rolled_back_at,
  started_at,
  applied_steps_count
)
SELECT 
  gen_random_uuid()::text,
  '6a3e273a701f6ecd51dc242a26929a89458580566125867bb4210a6256b26cdf',
  NOW(),
  '20251110150000_prevent_direct_users_premium_updates',
  NULL,
  NULL,
  NOW(),
  1
WHERE NOT EXISTS (
  SELECT 1 FROM _prisma_migrations 
  WHERE migration_name = '20251110150000_prevent_direct_users_premium_updates'
);

