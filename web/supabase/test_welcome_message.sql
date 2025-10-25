-- 测试新用户欢迎消息功能
-- 在 Supabase SQL Editor 中运行这个脚本来测试

-- 1. 检查 TOP Support 用户是否存在
SELECT id, username, email, role FROM users WHERE id = 1;

-- 2. 检查现有对话
SELECT 
    c.id,
    c.initiator_id,
    c.participant_id,
    c.type,
    u1.username as initiator_name,
    u2.username as participant_name
FROM conversations c
JOIN users u1 ON c.initiator_id = u1.id
JOIN users u2 ON c.participant_id = u2.id
WHERE c.type = 'SUPPORT'
ORDER BY c.created_at DESC
LIMIT 10;

-- 3. 检查现有欢迎消息
SELECT 
    m.id,
    m.conversation_id,
    m.sender_id,
    m.receiver_id,
    m.content,
    s.username as sender_name,
    r.username as receiver_name,
    m.created_at
FROM messages m
JOIN users s ON m.sender_id = s.id
JOIN users r ON m.receiver_id = r.id
WHERE m.sender_id = 1 -- TOP Support 发送的消息
ORDER BY m.created_at DESC
LIMIT 10;

-- 4. 测试创建新用户（模拟注册）
-- 注意：这会创建一个测试用户，请在生产环境中小心使用
INSERT INTO users (username, email, role, status, created_at)
VALUES ('test_user_' || extract(epoch from now()), 'test@example.com', 'USER', 'ACTIVE', NOW())
RETURNING id, username;

-- 5. 检查新用户是否收到了欢迎消息
-- 运行上面的查询来查看新创建的对话和消息

-- 6. 清理测试数据（可选）
-- DELETE FROM users WHERE username LIKE 'test_user_%';

