-- 创建新用户自动欢迎消息的触发器
-- 当新用户注册时，自动创建 TOP Support 对话和欢迎消息

-- 1. 创建触发器函数
CREATE OR REPLACE FUNCTION send_welcome_message()
RETURNS TRIGGER AS $$
DECLARE
    new_conversation_id INTEGER;
BEGIN
    -- 创建与 TOP Support 的对话
    INSERT INTO conversations (initiator_id, participant_id, type, status, created_at, updated_at)
    VALUES (NEW.id, 1, 'SUPPORT', 'ACTIVE', NOW(), NOW())
    RETURNING id INTO new_conversation_id;

    -- 插入欢迎消息
    INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, created_at)
    VALUES (
        new_conversation_id, 
        1, -- TOP Support 的 ID
        NEW.id, -- 新用户的 ID
        format('Hey @%s, Welcome to TOP! 👋', NEW.username), 
        'TEXT',
        NOW()
    );

    -- 更新对话的最后消息时间
    UPDATE conversations 
    SET last_message_at = NOW()
    WHERE id = new_conversation_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 创建触发器
DROP TRIGGER IF EXISTS on_user_created_send_welcome ON users;
CREATE TRIGGER on_user_created_send_welcome
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION send_welcome_message();

-- 3. 确保 TOP Support 用户存在（ID = 1）
INSERT INTO users (id, username, email, role, status, created_at)
VALUES (1, 'TOP Support', 'support@top.com', 'ADMIN', 'ACTIVE', NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. 为现有用户创建欢迎消息（可选，如果需要的话）
-- 这个查询会为所有没有 TOP Support 对话的用户创建对话和欢迎消息
INSERT INTO conversations (initiator_id, participant_id, type, status, created_at, updated_at)
SELECT 
    u.id,
    1,
    'SUPPORT',
    'ACTIVE',
    NOW(),
    NOW()
FROM users u
WHERE u.id != 1 -- 排除 TOP Support 自己
AND NOT EXISTS (
    SELECT 1 FROM conversations c 
    WHERE c.initiator_id = u.id 
    AND c.participant_id = 1 
    AND c.type = 'SUPPORT'
);

-- 为这些对话添加欢迎消息
INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, created_at)
SELECT 
    c.id,
    1,
    c.initiator_id,
    format('Hey @%s, Welcome to TOP! 👋', u.username),
    'TEXT',
    NOW()
FROM conversations c
JOIN users u ON c.initiator_id = u.id
WHERE c.participant_id = 1 
AND c.type = 'SUPPORT'
AND NOT EXISTS (
    SELECT 1 FROM messages m 
    WHERE m.conversation_id = c.id 
    AND m.sender_id = 1
);

-- 更新对话的最后消息时间
UPDATE conversations 
SET last_message_at = NOW()
WHERE participant_id = 1 
AND type = 'SUPPORT'
AND last_message_at IS NULL;

