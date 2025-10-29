-- 修复 shipping fee 数据
-- 当 shippingOption 包含 "Buyer pays – $3" 或 "Buyer pays – $5" 时，应该设置相应的 shipping_fee

-- 修复 "Buyer pays – $3 (within 10km)"
UPDATE listings
SET shipping_fee = 3
WHERE shipping_option = 'Buyer pays – $3 (within 10km)'
  AND (shipping_fee IS NULL OR shipping_fee = 0);

-- 修复 "Buyer pays – $5 (island-wide)"
UPDATE listings
SET shipping_fee = 5
WHERE shipping_option = 'Buyer pays – $5 (island-wide)'
  AND (shipping_fee IS NULL OR shipping_fee = 0);

-- 修复 "Free shipping" 和 "Meet-up"
UPDATE listings
SET shipping_fee = 0
WHERE shipping_option IN ('Free shipping', 'Meet-up')
  AND shipping_fee IS NOT NULL
  AND shipping_fee != 0;

-- 检查更新结果
SELECT 
  id,
  name,
  shipping_option,
  shipping_fee,
  location
FROM listings
WHERE shipping_option LIKE '%Buyer pays%'
ORDER BY created_at DESC
LIMIT 20;



