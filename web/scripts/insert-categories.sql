-- Seed script for the canonical listing categories used by the app.
-- Run with: psql < web/insert-categories.sql

INSERT INTO listing_categories (name, description, created_at, updated_at)
SELECT * FROM (
  VALUES
    ('Accessories', 'General accessories such as bags, jewelry, belts, etc.', NOW(), NOW()),
    ('Bottoms', 'Pants, jeans, skirts, shorts and similar items.', NOW(), NOW()),
    ('Footwear', 'Sneakers, boots, heels and other shoes.', NOW(), NOW()),
    ('Outerwear', 'Coats, jackets, blazers and layering pieces.', NOW(), NOW()),
    ('Tops', 'Tops, shirts, dresses, hoodies and similar apparel.', NOW(), NOW())
) AS v(name, description, created_at, updated_at)
WHERE NOT EXISTS (
  SELECT 1 FROM listing_categories lc WHERE lc.name = v.name
);
