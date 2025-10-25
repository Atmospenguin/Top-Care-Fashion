-- 分步插入分类数据
-- 步骤 1: 插入性别分类

-- 插入性别分类
INSERT INTO listing_categories (name, description, parent_id, created_at, updated_at) VALUES
('men', 'Men''s Clothing', NULL, NOW(), NOW()),
('women', 'Women''s Clothing', NULL, NOW(), NOW()),
('unisex', 'Unisex Clothing', NULL, NOW(), NOW());

-- 查看插入的性别分类ID
SELECT id, name FROM listing_categories WHERE parent_id IS NULL ORDER BY id;
