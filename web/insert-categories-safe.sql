-- Idempotent insert of the canonical listing categories.

WITH payload AS (
  SELECT * FROM (VALUES
    ('Accessories'::text, 'General accessories such as bags, jewelry, belts, etc.'::text),
    ('Bottoms',        'Pants, jeans, skirts, shorts and similar items.'),
    ('Footwear',       'Sneakers, boots, heels and other shoes.'),
    ('Outerwear',      'Coats, jackets, blazers and layering pieces.'),
    ('Tops',           'Tops, shirts, dresses, hoodies and similar apparel.')
  ) AS v(name, description)
)
INSERT INTO listing_categories (name, description, created_at, updated_at)
SELECT name, description, NOW(), NOW()
FROM payload p
WHERE NOT EXISTS (
  SELECT 1 FROM listing_categories lc WHERE lc.name = p.name
);

SELECT 'Categories ensured' AS result;
