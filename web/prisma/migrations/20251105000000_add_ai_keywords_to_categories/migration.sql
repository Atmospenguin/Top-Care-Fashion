-- Add AI classification fields to listing_categories
ALTER TABLE listing_categories ADD COLUMN ai_keywords JSONB;
ALTER TABLE listing_categories ADD COLUMN ai_weight_boost DOUBLE PRECISION DEFAULT 1.0;

-- Disable all categories first
UPDATE listing_categories SET is_active = false;

-- Delete or disable Bags and Dresses if they exist
UPDATE listing_categories SET is_active = false WHERE name IN ('Bags', 'Dresses');

-- Insert/Update the 5 core categories with AI keywords
-- 1. Tops
INSERT INTO listing_categories (name, description, is_active, sort_order, ai_keywords, ai_weight_boost, created_at)
VALUES (
  'Tops',
  'Shirts, blouses, sweaters, hoodies, and other upper body clothing',
  true,
  1,
  '["shirt","t-shirt","tee","blouse","sweater","hoodie","cardigan","pullover","top","tank","camisole","polo","jersey","jumper","knitwear","crewneck","long sleeve","sweatshirt","uniform shirt","denim shirt","sleeve","neck","collar","wool","woolen","fur"]'::jsonb,
  2.0,
  NOW()
)
ON CONFLICT (name)
DO UPDATE SET
  is_active = true,
  sort_order = 1,
  ai_keywords = '["shirt","t-shirt","tee","blouse","sweater","hoodie","cardigan","pullover","top","tank","camisole","polo","jersey","jumper","knitwear","crewneck","long sleeve","sweatshirt","uniform shirt","denim shirt","sleeve","neck","collar","wool","woolen","fur"]'::jsonb,
  ai_weight_boost = 2.0,
  description = 'Shirts, blouses, sweaters, hoodies, and other upper body clothing';

-- 2. Bottoms
INSERT INTO listing_categories (name, description, is_active, sort_order, ai_keywords, ai_weight_boost, created_at)
VALUES (
  'Bottoms',
  'Pants, jeans, shorts, skirts, and other lower body clothing',
  true,
  2,
  '["pants","trousers","jeans","shorts","skirt","skirts","midi skirt","maxi skirt","mini skirt","pleated skirt","a-line skirt","a line skirt","wrap skirt","tiered skirt","balloon skirt","long skirt","denim skirt","tulle skirt","circle skirt","a-line","a line","waist"]'::jsonb,
  2.0,
  NOW()
)
ON CONFLICT (name)
DO UPDATE SET
  is_active = true,
  sort_order = 2,
  ai_keywords = '["pants","trousers","jeans","shorts","skirt","skirts","midi skirt","maxi skirt","mini skirt","pleated skirt","a-line skirt","a line skirt","wrap skirt","tiered skirt","balloon skirt","long skirt","denim skirt","tulle skirt","circle skirt","a-line","a line","waist"]'::jsonb,
  ai_weight_boost = 2.0,
  description = 'Pants, jeans, shorts, skirts, and other lower body clothing';

-- 3. Outerwear
INSERT INTO listing_categories (name, description, is_active, sort_order, ai_keywords, ai_weight_boost, created_at)
VALUES (
  'Outerwear',
  'Coats, jackets, blazers, and other outer garments',
  true,
  3,
  '["coat","jacket","blazer","trench","windbreaker","parka","overcoat","bomber jacket","raincoat","puffer","vest"]'::jsonb,
  1.4,
  NOW()
)
ON CONFLICT (name)
DO UPDATE SET
  is_active = true,
  sort_order = 3,
  ai_keywords = '["coat","jacket","blazer","trench","windbreaker","parka","overcoat","bomber jacket","raincoat","puffer","vest"]'::jsonb,
  ai_weight_boost = 1.4,
  description = 'Coats, jackets, blazers, and other outer garments';

-- 4. Footwear
INSERT INTO listing_categories (name, description, is_active, sort_order, ai_keywords, ai_weight_boost, created_at)
VALUES (
  'Footwear',
  'Shoes, sneakers, boots, heels, and other footwear',
  true,
  4,
  '["shoe","sneaker","boot","heels","sandals","flip-flops","loafers","footwear","oxford","running shoe","slippers","trainer","cleats","platform shoe"]'::jsonb,
  1.6,
  NOW()
)
ON CONFLICT (name)
DO UPDATE SET
  is_active = true,
  sort_order = 4,
  ai_keywords = '["shoe","sneaker","boot","heels","sandals","flip-flops","loafers","footwear","oxford","running shoe","slippers","trainer","cleats","platform shoe"]'::jsonb,
  ai_weight_boost = 1.6,
  description = 'Shoes, sneakers, boots, heels, and other footwear';

-- 5. Accessories
INSERT INTO listing_categories (name, description, is_active, sort_order, ai_keywords, ai_weight_boost, created_at)
VALUES (
  'Accessories',
  'Watches, hats, belts, scarves, bags, jewelry, and other accessories',
  true,
  5,
  '["watch","hat","cap","beanie","belt","scarf","sunglasses","glasses","tie","wallet","earrings","necklace","ring","bracelet","jewelry","umbrella","hairband","bag","handbag","purse","tote","backpack","clutch","crossbody","satchel","shoulder bag","duffel","sling bag","briefcase","shopping bag","fanny pack"]'::jsonb,
  1.0,
  NOW()
)
ON CONFLICT (name)
DO UPDATE SET
  is_active = true,
  sort_order = 5,
  ai_keywords = '["watch","hat","cap","beanie","belt","scarf","sunglasses","glasses","tie","wallet","earrings","necklace","ring","bracelet","jewelry","umbrella","hairband","bag","handbag","purse","tote","backpack","clutch","crossbody","satchel","shoulder bag","duffel","sling bag","briefcase","shopping bag","fanny pack"]'::jsonb,
  ai_weight_boost = 1.0,
  description = 'Watches, hats, belts, scarves, bags, jewelry, and other accessories';

-- Add unique constraint on name if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'listing_categories_name_key'
  ) THEN
    ALTER TABLE listing_categories ADD CONSTRAINT listing_categories_name_key UNIQUE (name);
  END IF;
END $$;
