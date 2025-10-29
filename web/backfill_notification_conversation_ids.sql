-- ✅ 回填旧通知的 conversation_id
-- 在 Supabase SQL Editor 中执行此文件

-- Step 1: 为 ORDER 通知回填 conversation_id
-- 通过 order_id 查找对应的 conversation
UPDATE notifications n
SET conversation_id = (
  SELECT c.id
  FROM conversations c
  JOIN orders o ON (
    c.listing_id = o.listing_id
    AND (
      (c.initiator_id = o.buyer_id AND c.participant_id = o.seller_id)
      OR
      (c.initiator_id = o.seller_id AND c.participant_id = o.buyer_id)
    )
  )
  WHERE o.id = CAST(n.order_id AS INTEGER)
  LIMIT 1
)
WHERE n.type = 'ORDER' 
AND n.order_id IS NOT NULL 
AND n.conversation_id IS NULL;

-- Step 2: 为 REVIEW 通知回填 conversation_id
-- REVIEW 通知也关联订单，逻辑相同
UPDATE notifications n
SET conversation_id = (
  SELECT c.id
  FROM conversations c
  JOIN orders o ON (
    c.listing_id = o.listing_id
    AND (
      (c.initiator_id = o.buyer_id AND c.participant_id = o.seller_id)
      OR
      (c.initiator_id = o.seller_id AND c.participant_id = o.buyer_id)
    )
  )
  WHERE o.id = CAST(n.order_id AS INTEGER)
  LIMIT 1
)
WHERE n.type = 'REVIEW' 
AND n.order_id IS NOT NULL 
AND n.conversation_id IS NULL;

-- ✅ 验证回填结果
SELECT 
  type,
  COUNT(*) as total,
  COUNT(conversation_id) as with_conversation_id,
  COUNT(*) - COUNT(conversation_id) as missing_conversation_id
FROM notifications
WHERE type IN ('ORDER', 'REVIEW')
GROUP BY type;

-- ✅ 查看没有 conversation_id 的通知
SELECT 
  id,
  type,
  title,
  order_id,
  conversation_id,
  created_at
FROM notifications
WHERE type IN ('ORDER', 'REVIEW')
AND conversation_id IS NULL
ORDER BY created_at DESC
LIMIT 10;

