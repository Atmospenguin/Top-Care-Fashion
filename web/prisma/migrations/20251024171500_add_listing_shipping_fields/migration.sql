-- Add shipping fields to listings table if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'shipping_option'
  ) THEN
    ALTER TABLE listings ADD COLUMN shipping_option VARCHAR(50);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'shipping_fee'
  ) THEN
    ALTER TABLE listings ADD COLUMN shipping_fee DECIMAL(10,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'location'
  ) THEN
    ALTER TABLE listings ADD COLUMN location VARCHAR(100);
  END IF;
END $$;

