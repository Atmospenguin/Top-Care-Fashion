-- 修复已完成订单但商品状态未更新的问题
-- 将所有已完成订单（RECEIVED/COMPLETED）对应的商品标记为已售出

UPDATE listings
SET 
  sold = true,
  sold_at = COALESCE(sold_at, NOW())
WHERE id IN (
  SELECT DISTINCT listing_id
  FROM orders
  WHERE status IN ('RECEIVED', 'COMPLETED', 'REVIEWED')
    AND listing_id IS NOT NULL
)
AND sold = false;

-- 查看受影响的商品
SELECT 
  l.id,
  l.name,
  l.sold,
  l.sold_at,
  o.status as order_status,
  o.created_at as order_date
FROM listings l
JOIN orders o ON o.listing_id = l.id
WHERE o.status IN ('RECEIVED', 'COMPLETED', 'REVIEWED')
ORDER BY o.created_at DESC;

