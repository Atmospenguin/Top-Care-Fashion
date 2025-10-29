-- ✅ 检查最新的通知数据（包括所有必要字段）

-- 查看最新的 REVIEW 通知
SELECT 
  id,
  type,
  title,
  order_id,
  listing_id,
  conversation_id,
  related_user_id,
  created_at
FROM notifications
WHERE type = 'REVIEW'
ORDER BY created_at DESC
LIMIT 5;

-- 查看最新的 ORDER 通知
SELECT 
  id,
  type,
  title,
  order_id,
  listing_id,
  conversation_id,
  related_user_id,
  created_at
FROM notifications
WHERE type = 'ORDER'
ORDER BY created_at DESC
LIMIT 5;

-- 统计各类型通知的字段完整性
SELECT 
  type,
  COUNT(*) as total,
  COUNT(order_id) as has_order_id,
  COUNT(conversation_id) as has_conversation_id,
  COUNT(listing_id) as has_listing_id,
  COUNT(related_user_id) as has_related_user_id
FROM notifications
WHERE type IN ('ORDER', 'REVIEW')
GROUP BY type;


