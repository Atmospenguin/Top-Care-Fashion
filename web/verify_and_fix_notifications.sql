-- ========================================
-- 🔍 第一步：检查最新创建的通知
-- ========================================

-- 查看最新的 5 条 REVIEW 通知（检查是否有 order_id 和 conversation_id）
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

-- 查看最新的 5 条 ORDER 通知
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

-- ========================================
-- 🧹 第二步：（可选）清理无效的旧通知
-- ========================================

-- 如果上面的查询显示新通知也缺少字段，就先不执行清理
-- 如果新通知都有正确的字段，可以执行以下清理

/*
-- 删除无法使用的旧 REVIEW 通知
DELETE FROM notifications
WHERE type = 'REVIEW'
AND (order_id IS NULL OR conversation_id IS NULL)
AND created_at < NOW() - INTERVAL '1 hour'; -- 只删除 1 小时前的旧通知

-- 删除无法使用的旧 ORDER 通知
DELETE FROM notifications
WHERE type = 'ORDER'
AND conversation_id IS NULL
AND created_at < NOW() - INTERVAL '1 hour';
*/

-- ========================================
-- 📊 第三步：统计验证
-- ========================================

SELECT 
  type,
  COUNT(*) as total,
  COUNT(order_id) as has_order_id,
  COUNT(conversation_id) as has_conversation_id,
  COUNT(listing_id) as has_listing_id,
  COUNT(CASE WHEN order_id IS NOT NULL AND conversation_id IS NOT NULL THEN 1 END) as complete_records
FROM notifications
WHERE type IN ('ORDER', 'REVIEW')
GROUP BY type;


