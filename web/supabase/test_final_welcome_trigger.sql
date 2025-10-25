-- =========================================================
-- 🧪 TOP Care Fashion - Welcome Message Trigger Test
-- 测试新用户欢迎消息功能
-- =========================================================

-- 1️⃣ 检查 TOP Support 用户是否存在
SELECT 
  id, 
  username, 
  email, 
  role, 
  status,
  created_at
FROM users 
WHERE id = 1;

-- 2️⃣ 查看现有的 SUPPORT 类型对话
SELECT 
  c.id,
  c.initiator_id,
  c.participant_id,
  c.type,
  c.status,
  c.last_message_at,
  u1.username as initiator_name,
  u2.username as participant_name,
  c.created_at
FROM conversations c
JOIN users u1 ON c.initiator_id = u1.id
JOIN users u2 ON c.participant_id = u2.id
WHERE c.type = 'SUPPORT'
ORDER BY c.created_at DESC
LIMIT 10;

-- 3️⃣ 查看现有的欢迎消息
SELECT 
  m.id,
  m.conversation_id,
  m.sender_id,
  m.receiver_id,
  m.content,
  m.message_type,
  m.is_read,
  s.username as sender_name,
  r.username as receiver_name,
  m.created_at
FROM messages m
JOIN users s ON m.sender_id = s.id
JOIN users r ON m.receiver_id = r.id
WHERE m.sender_id = 1 -- TOP Support 发送的消息
ORDER BY m.created_at DESC
LIMIT 10;

-- 4️⃣ 测试创建新用户（模拟注册）
-- ⚠️ 注意：这会创建一个测试用户，请在生产环境中小心使用
INSERT INTO users (
  username, 
  email, 
  role, 
  status, 
  created_at
)
VALUES (
  'test_user_' || EXTRACT(EPOCH FROM NOW())::INT, 
  'test_' || EXTRACT(EPOCH FROM NOW())::INT || '@example.com', 
  'USER', 
  'ACTIVE', 
  NOW()
)
RETURNING id, username, email;

-- 5️⃣ 检查新用户是否收到了欢迎消息
-- 运行上面的查询来查看新创建的对话和消息

-- 6️⃣ 清理测试数据（可选，取消注释来执行）
-- DELETE FROM users WHERE username LIKE 'test_user_%';
-- DELETE FROM conversations WHERE initiator_id IN (
--   SELECT id FROM users WHERE username LIKE 'test_user_%'
-- );
-- DELETE FROM messages WHERE receiver_id IN (
--   SELECT id FROM users WHERE username LIKE 'test_user_%'
-- );

-- =========================================================
-- 📊 预期结果
-- =========================================================
-- 
-- conversations 表应该显示：
-- | id | initiator_id | participant_id | type    | status |
-- |----|--------------|----------------|---------|--------|
-- | X  | 新用户ID       | 1              | SUPPORT | ACTIVE |
-- 
-- messages 表应该显示：
-- | id | conversation_id | sender_id | receiver_id | content                    |
-- |----|-----------------|-----------|-------------|----------------------------|
-- | Y  | X               | 1         | 新用户ID      | "Hey @用户名, Welcome!"     |
-- 
-- =========================================================

