-- 插入商品分类数据
-- 基于 CategoryDetailScreen.tsx 中的分类结构

-- 首先插入主分类
INSERT INTO listing_categories (name, description, parent_id, created_at, updated_at) VALUES
-- 性别分类
('men', 'Men\'s Clothing', NULL, NOW(), NOW()),
('women', 'Women\'s Clothing', NULL, NOW(), NOW()),
('unisex', 'Unisex Clothing', NULL, NOW(), NOW());

-- 获取刚插入的性别分类ID（假设 men=1, women=2, unisex=3）
-- 插入主分类
INSERT INTO listing_categories (name, description, parent_id, created_at, updated_at) VALUES
-- Men's categories
('Tops', 'Men\'s Tops', 1, NOW(), NOW()),
('Bottoms', 'Men\'s Bottoms', 1, NOW(), NOW()),
('Outerwear', 'Men\'s Outerwear', 1, NOW(), NOW()),
('Footwear', 'Men\'s Footwear', 1, NOW(), NOW()),
('Accessories', 'Men\'s Accessories', 1, NOW(), NOW()),

-- Women's categories
('Tops', 'Women\'s Tops', 2, NOW(), NOW()),
('Bottoms', 'Women\'s Bottoms', 2, NOW(), NOW()),
('Outerwear', 'Women\'s Outerwear', 2, NOW(), NOW()),
('Footwear', 'Women\'s Footwear', 2, NOW(), NOW()),
('Accessories', 'Women\'s Accessories', 2, NOW(), NOW()),
('Dresses', 'Women\'s Dresses', 2, NOW(), NOW()),

-- Unisex categories
('Tops', 'Unisex Tops', 3, NOW(), NOW()),
('Bottoms', 'Unisex Bottoms', 3, NOW(), NOW()),
('Outerwear', 'Unisex Outerwear', 3, NOW(), NOW()),
('Footwear', 'Unisex Footwear', 3, NOW(), NOW()),
('Accessories', 'Unisex Accessories', 3, NOW(), NOW()),
('Dresses', 'Unisex Dresses', 3, NOW(), NOW());

-- 插入子分类（Men's）
INSERT INTO listing_categories (name, description, parent_id, created_at, updated_at) VALUES
-- Men's Tops subcategories (假设 Men's Tops ID = 4)
('T-shirts', 'Men\'s T-shirts', 4, NOW(), NOW()),
('Hoodies', 'Men\'s Hoodies', 4, NOW(), NOW()),
('Shirts', 'Men\'s Shirts', 4, NOW(), NOW()),
('Sweaters', 'Men\'s Sweaters', 4, NOW(), NOW()),
('Crop tops', 'Men\'s Crop tops', 4, NOW(), NOW()),
('Tank tops', 'Men\'s Tank tops', 4, NOW(), NOW()),
('Other', 'Other Men\'s Tops', 4, NOW(), NOW()),

-- Men's Bottoms subcategories (假设 Men's Bottoms ID = 5)
('Jeans', 'Men\'s Jeans', 5, NOW(), NOW()),
('Pants', 'Men\'s Pants', 5, NOW(), NOW()),
('Shorts', 'Men\'s Shorts', 5, NOW(), NOW()),
('Skirts', 'Men\'s Skirts', 5, NOW(), NOW()),
('Leggings', 'Men\'s Leggings', 5, NOW(), NOW()),
('Other', 'Other Men\'s Bottoms', 5, NOW(), NOW()),

-- Men's Outerwear subcategories (假设 Men's Outerwear ID = 6)
('Jackets', 'Men\'s Jackets', 6, NOW(), NOW()),
('Coats', 'Men\'s Coats', 6, NOW(), NOW()),
('Vests', 'Men\'s Vests', 6, NOW(), NOW()),
('Blazers', 'Men\'s Blazers', 6, NOW(), NOW()),
('Other', 'Other Men\'s Outerwear', 6, NOW(), NOW()),

-- Men's Footwear subcategories (假设 Men's Footwear ID = 7)
('Sneakers', 'Men\'s Sneakers', 7, NOW(), NOW()),
('Boots', 'Men\'s Boots', 7, NOW(), NOW()),
('Loafers', 'Men\'s Loafers', 7, NOW(), NOW()),
('Sandals', 'Men\'s Sandals', 7, NOW(), NOW()),
('Slippers', 'Men\'s Slippers', 7, NOW(), NOW()),
('Other', 'Other Men\'s Footwear', 7, NOW(), NOW()),

-- Men's Accessories subcategories (假设 Men's Accessories ID = 8)
('Bags', 'Men\'s Bags', 8, NOW(), NOW()),
('Hats and caps', 'Men\'s Hats and caps', 8, NOW(), NOW()),
('Jewelry', 'Men\'s Jewelry', 8, NOW(), NOW()),
('Sunglasses', 'Men\'s Sunglasses', 8, NOW(), NOW()),
('Watches', 'Men\'s Watches', 8, NOW(), NOW()),
('Scarves', 'Men\'s Scarves', 8, NOW(), NOW()),
('Belts', 'Men\'s Belts', 8, NOW(), NOW()),
('Other', 'Other Men\'s Accessories', 8, NOW(), NOW());

-- 插入子分类（Women's）
INSERT INTO listing_categories (name, description, parent_id, created_at, updated_at) VALUES
-- Women's Tops subcategories (假设 Women's Tops ID = 9)
('T-shirts', 'Women\'s T-shirts', 9, NOW(), NOW()),
('Blouses', 'Women\'s Blouses', 9, NOW(), NOW()),
('Crop tops', 'Women\'s Crop tops', 9, NOW(), NOW()),
('Tank tops', 'Women\'s Tank tops', 9, NOW(), NOW()),
('Hoodies', 'Women\'s Hoodies', 9, NOW(), NOW()),
('Sweaters', 'Women\'s Sweaters', 9, NOW(), NOW()),
('Other', 'Other Women\'s Tops', 9, NOW(), NOW()),

-- Women's Bottoms subcategories (假设 Women's Bottoms ID = 10)
('Jeans', 'Women\'s Jeans', 10, NOW(), NOW()),
('Skirts', 'Women\'s Skirts', 10, NOW(), NOW()),
('Pants', 'Women\'s Pants', 10, NOW(), NOW()),
('Leggings', 'Women\'s Leggings', 10, NOW(), NOW()),
('Shorts', 'Women\'s Shorts', 10, NOW(), NOW()),
('Other', 'Other Women\'s Bottoms', 10, NOW(), NOW()),

-- Women's Outerwear subcategories (假设 Women's Outerwear ID = 11)
('Jackets', 'Women\'s Jackets', 11, NOW(), NOW()),
('Coats', 'Women\'s Coats', 11, NOW(), NOW()),
('Blazers', 'Women\'s Blazers', 11, NOW(), NOW()),
('Cardigans', 'Women\'s Cardigans', 11, NOW(), NOW()),
('Other', 'Other Women\'s Outerwear', 11, NOW(), NOW()),

-- Women's Footwear subcategories (假设 Women's Footwear ID = 12)
('Sneakers', 'Women\'s Sneakers', 12, NOW(), NOW()),
('Boots', 'Women\'s Boots', 12, NOW(), NOW()),
('Heels', 'Women\'s Heels', 12, NOW(), NOW()),
('Flats', 'Women\'s Flats', 12, NOW(), NOW()),
('Sandals', 'Women\'s Sandals', 12, NOW(), NOW()),
('Other', 'Other Women\'s Footwear', 12, NOW(), NOW()),

-- Women's Accessories subcategories (假设 Women's Accessories ID = 13)
('Bags', 'Women\'s Bags', 13, NOW(), NOW()),
('Jewelry', 'Women\'s Jewelry', 13, NOW(), NOW()),
('Sunglasses', 'Women\'s Sunglasses', 13, NOW(), NOW()),
('Belts', 'Women\'s Belts', 13, NOW(), NOW()),
('Hair accessories', 'Women\'s Hair accessories', 13, NOW(), NOW()),
('Other', 'Other Women\'s Accessories', 13, NOW(), NOW()),

-- Women's Dresses subcategories (假设 Women's Dresses ID = 14)
('Mini dresses', 'Women\'s Mini dresses', 14, NOW(), NOW()),
('Midi dresses', 'Women\'s Midi dresses', 14, NOW(), NOW()),
('Maxi dresses', 'Women\'s Maxi dresses', 14, NOW(), NOW()),
('Bodycon', 'Women\'s Bodycon dresses', 14, NOW(), NOW()),
('Other', 'Other Women\'s Dresses', 14, NOW(), NOW());

-- 插入子分类（Unisex）
INSERT INTO listing_categories (name, description, parent_id, created_at, updated_at) VALUES
-- Unisex Tops subcategories (假设 Unisex Tops ID = 15)
('T-shirts', 'Unisex T-shirts', 15, NOW(), NOW()),
('Hoodies', 'Unisex Hoodies', 15, NOW(), NOW()),
('Shirts', 'Unisex Shirts', 15, NOW(), NOW()),
('Sweaters', 'Unisex Sweaters', 15, NOW(), NOW()),
('Other', 'Other Unisex Tops', 15, NOW(), NOW()),

-- Unisex Bottoms subcategories (假设 Unisex Bottoms ID = 16)
('Jeans', 'Unisex Jeans', 16, NOW(), NOW()),
('Pants', 'Unisex Pants', 16, NOW(), NOW()),
('Shorts', 'Unisex Shorts', 16, NOW(), NOW()),
('Joggers', 'Unisex Joggers', 16, NOW(), NOW()),
('Other', 'Other Unisex Bottoms', 16, NOW(), NOW()),

-- Unisex Outerwear subcategories (假设 Unisex Outerwear ID = 17)
('Jackets', 'Unisex Jackets', 17, NOW(), NOW()),
('Coats', 'Unisex Coats', 17, NOW(), NOW()),
('Vests', 'Unisex Vests', 17, NOW(), NOW()),
('Other', 'Other Unisex Outerwear', 17, NOW(), NOW()),

-- Unisex Footwear subcategories (假设 Unisex Footwear ID = 18)
('Sneakers', 'Unisex Sneakers', 18, NOW(), NOW()),
('Boots', 'Unisex Boots', 18, NOW(), NOW()),
('Sandals', 'Unisex Sandals', 18, NOW(), NOW()),
('Other', 'Other Unisex Footwear', 18, NOW(), NOW()),

-- Unisex Accessories subcategories (假设 Unisex Accessories ID = 19)
('Bags', 'Unisex Bags', 19, NOW(), NOW()),
('Hats and caps', 'Unisex Hats and caps', 19, NOW(), NOW()),
('Sunglasses', 'Unisex Sunglasses', 19, NOW(), NOW()),
('Jewelry', 'Unisex Jewelry', 19, NOW(), NOW()),
('Other', 'Other Unisex Accessories', 19, NOW(), NOW()),

-- Unisex Dresses subcategories (假设 Unisex Dresses ID = 20)
('Casual dresses', 'Unisex Casual dresses', 20, NOW(), NOW()),
('Oversized shirt dresses', 'Unisex Oversized shirt dresses', 20, NOW(), NOW()),
('Other', 'Other Unisex Dresses', 20, NOW(), NOW());
