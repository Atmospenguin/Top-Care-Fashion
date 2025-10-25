-- Add user preference fields and phone_number column if missing
DO $$
BEGIN
  -- preferred styles as JSONB
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'preferred_styles'
  ) THEN
    ALTER TABLE users ADD COLUMN preferred_styles JSONB;
  END IF;

  -- size preferences as VARCHAR
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'preferred_size_top'
  ) THEN
    ALTER TABLE users ADD COLUMN preferred_size_top VARCHAR(50);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'preferred_size_bottom'
  ) THEN
    ALTER TABLE users ADD COLUMN preferred_size_bottom VARCHAR(50);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'preferred_size_shoe'
  ) THEN
    ALTER TABLE users ADD COLUMN preferred_size_shoe VARCHAR(50);
  END IF;

  -- add phone_number to match Prisma schema, backfill from phone if present
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
  END IF;

  -- optional backfill: copy users.phone -> users.phone_number when phone_number is null
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'phone'
  ) THEN
    UPDATE users SET phone_number = COALESCE(phone_number, phone);
  END IF;
END $$;

