-- Add supabase_user_id column and unique index on users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "supabase_user_id" uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'users_supabase_user_id_key'
  ) THEN
    CREATE UNIQUE INDEX "users_supabase_user_id_key" ON "users"("supabase_user_id");
  END IF;
END $$;


