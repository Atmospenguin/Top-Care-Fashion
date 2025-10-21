-- 更安全的分类插入脚本
-- 使用 CTE (Common Table Expression) 来避免硬编码 ID

WITH gender_categories AS (
  INSERT INTO listing_categories (name, description, parent_id, created_at, updated_at) VALUES
  ('men', 'Men''s Clothing', NULL, NOW(), NOW()),
  ('women', 'Women''s Clothing', NULL, NOW(), NOW()),
  ('unisex', 'Unisex Clothing', NULL, NOW(), NOW())
  RETURNING id, name
),
men_main_categories AS (
  INSERT INTO listing_categories (name, description, parent_id, created_at, updated_at)
  SELECT 
    main_cat.name,
    'Men''s ' || main_cat.name,
    gc.id,
    NOW(),
    NOW()
  FROM gender_categories gc
  CROSS JOIN (VALUES 
    ('Tops'), ('Bottoms'), ('Outerwear'), ('Footwear'), ('Accessories')
  ) AS main_cat(name)
  WHERE gc.name = 'men'
  RETURNING id, name
),
women_main_categories AS (
  INSERT INTO listing_categories (name, description, parent_id, created_at, updated_at)
  SELECT 
    main_cat.name,
    'Women''s ' || main_cat.name,
    gc.id,
    NOW(),
    NOW()
  FROM gender_categories gc
  CROSS JOIN (VALUES 
    ('Tops'), ('Bottoms'), ('Outerwear'), ('Footwear'), ('Accessories'), ('Dresses')
  ) AS main_cat(name)
  WHERE gc.name = 'women'
  RETURNING id, name
),
unisex_main_categories AS (
  INSERT INTO listing_categories (name, description, parent_id, created_at, updated_at)
  SELECT 
    main_cat.name,
    'Unisex ' || main_cat.name,
    gc.id,
    NOW(),
    NOW()
  FROM gender_categories gc
  CROSS JOIN (VALUES 
    ('Tops'), ('Bottoms'), ('Outerwear'), ('Footwear'), ('Accessories'), ('Dresses')
  ) AS main_cat(name)
  WHERE gc.name = 'unisex'
  RETURNING id, name
)
-- 这里可以继续添加子分类的插入
SELECT 'Categories inserted successfully' as result;
