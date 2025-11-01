-- Update Gender enum to use proper capitalized values
-- Step 1: Rename old enum
ALTER TYPE "Gender" RENAME TO "Gender_old";

-- Step 2: Create new enum with updated values
CREATE TYPE "Gender" AS ENUM ('Men', 'Women', 'Unisex');

-- Step 3: Update users table
ALTER TABLE "users"
  ALTER COLUMN "gender" DROP DEFAULT,
  ALTER COLUMN "gender" TYPE "Gender" USING (
    CASE
      WHEN "gender"::text = 'MALE' THEN 'Men'::"Gender"
      WHEN "gender"::text = 'FEMALE' THEN 'Women'::"Gender"
      ELSE NULL
    END
  );

-- Step 4: Update listings table - change from VARCHAR to enum
ALTER TABLE "listings"
  ALTER COLUMN "gender" DROP DEFAULT,
  ALTER COLUMN "gender" TYPE "Gender" USING (
    CASE
      WHEN LOWER("gender") IN ('men', 'male', 'man') THEN 'Men'::"Gender"
      WHEN LOWER("gender") IN ('women', 'female', 'woman') THEN 'Women'::"Gender"
      WHEN LOWER("gender") IN ('unisex', 'both') THEN 'Unisex'::"Gender"
      ELSE 'Unisex'::"Gender"
    END
  ),
  ALTER COLUMN "gender" SET DEFAULT 'Unisex'::"Gender";

-- Step 5: Drop old enum
DROP TYPE "Gender_old";
