-- Add privacy enum for users' likes and follow lists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'VisibilitySetting'
  ) THEN
    CREATE TYPE "VisibilitySetting" AS ENUM ('PUBLIC', 'FOLLOWERS_ONLY', 'PRIVATE');
  END IF;
END
$$;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "likes_visibility" "VisibilitySetting" NOT NULL DEFAULT 'PUBLIC',
  ADD COLUMN IF NOT EXISTS "follows_visibility" "VisibilitySetting" NOT NULL DEFAULT 'PUBLIC';
