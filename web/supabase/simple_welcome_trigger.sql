-- 简化版本：只为新用户创建欢迎消息触发器
-- 这个版本更安全，不会影响现有数据

-- 1. 确保 TOP Support 用户存在
INSERT INTO users (id, username, email, role, status, created_at)
VALUES (1, 'TOP Support', 'support@top.com', 'ADMIN', 'ACTIVE', NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. 创建触发器函数
CREATE OR REPLACE FUNCTION create_welcome_conversation()
RETURNS TRIGGER AS $$
DECLARE
    conversation_id INTEGER;
BEGIN
    -- 只为新用户创建对话（排除 TOP Support 自己）
    IF NEW.id != 1 THEN
        -- 创建与 TOP Support 的对话
        INSERT INTO conversations (initiator_id, participant_id, type, status, created_at, updated_at)
        VALUES (NEW.id, 1, 'SUPPORT', 'ACTIVE', NOW(), NOW())
        RETURNING id INTO conversation_id;

        -- 插入欢迎消息
        INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, created_at)
        VALUES (
            conversation_id, 
            1, -- TOP Support 发送
            NEW.id, -- 发送给新用户
            format('Hey @%s, Welcome to TOP! 👋', NEW.username), 
            'TEXT',
            NOW()
        );

        -- 更新对话的最后消息时间
        UPDATE conversations 
        SET last_message_at = NOW()
        WHERE id = conversation_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. 创建触发器
DROP TRIGGER IF EXISTS on_user_created_welcome ON users;
CREATE TRIGGER on_user_created_welcome
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_welcome_conversation();

