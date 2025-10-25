-- =========================================================
-- 📨 TOP Care Fashion - New User Welcome Message Trigger
-- Author: Cheng Zhenxi / TOP Care Fashion
-- Description: 新用户注册时自动创建 TOP Support 对话和欢迎消息
-- Compatible with: Prisma schema (conversations & messages tables)
-- =========================================================

-- ⚙️ Step 1: 确保 TOP Support 用户存在（ID=1）
INSERT INTO users (id, username, email, role, status, created_at)
VALUES (1, 'TOP Support', 'support@top.com', 'ADMIN', 'ACTIVE', NOW())
ON CONFLICT (id) DO NOTHING;

-- ⚙️ Step 2: 创建触发器函数
CREATE OR REPLACE FUNCTION public.send_welcome_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  top_support_id INT := 1;  -- TOP Support 用户的固定 ID
  new_conversation_id INT;
  welcome_text TEXT;
BEGIN
  -- 1️⃣ 确保不对 TOP Support 自己触发
  IF NEW.id = top_support_id THEN
    RETURN NEW;
  END IF;

  -- 2️⃣ 创建 conversation 记录
  INSERT INTO public.conversations (
    initiator_id, 
    participant_id, 
    type, 
    status, 
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id, 
    top_support_id, 
    'SUPPORT', 
    'ACTIVE', 
    NOW(), 
    NOW()
  )
  RETURNING id INTO new_conversation_id;

  -- 3️⃣ 构建欢迎文本
  welcome_text := FORMAT('Hey @%s, Welcome to TOP! 👋', NEW.username);

  -- 4️⃣ 插入欢迎消息
  INSERT INTO public.messages (
    conversation_id,
    sender_id,
    receiver_id,
    content,
    message_type,
    is_read,
    created_at
  )
  VALUES (
    new_conversation_id,
    top_support_id,  -- sender = TOP Support
    NEW.id,          -- receiver = 新注册用户
    welcome_text,
    'TEXT',
    FALSE,           -- 新消息未读
    NOW()
  );

  -- 5️⃣ 更新对话的最后消息时间
  UPDATE public.conversations 
  SET last_message_at = NOW()
  WHERE id = new_conversation_id;

  RETURN NEW;
END;
$$;

-- ⚙️ Step 3: 创建触发器
DROP TRIGGER IF EXISTS on_user_created_send_welcome ON public.users;

CREATE TRIGGER on_user_created_send_welcome
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_message();

-- =========================================================
-- ✅ 完成！每当有新用户注册（INSERT INTO users），
-- 系统会自动：
--   1. 创建一条 SUPPORT 类型的对话
--   2. 发送欢迎消息到 messages 表
--   3. 更新对话的最后消息时间
-- =========================================================

-- 🧪 测试查询（可选）
-- 查看 TOP Support 用户是否存在
-- SELECT id, username, email, role FROM users WHERE id = 1;

-- 查看最近的对话
-- SELECT 
--   c.id,
--   c.initiator_id,
--   c.participant_id,
--   c.type,
--   c.status,
--   u1.username as initiator_name,
--   u2.username as participant_name,
--   c.created_at
-- FROM conversations c
-- JOIN users u1 ON c.initiator_id = u1.id
-- JOIN users u2 ON c.participant_id = u2.id
-- WHERE c.type = 'SUPPORT'
-- ORDER BY c.created_at DESC
-- LIMIT 5;

-- 查看最近的欢迎消息
-- SELECT 
--   m.id,
--   m.conversation_id,
--   m.sender_id,
--   m.receiver_id,
--   m.content,
--   s.username as sender_name,
--   r.username as receiver_name,
--   m.created_at
-- FROM messages m
-- JOIN users s ON m.sender_id = s.id
-- JOIN users r ON m.receiver_id = r.id
-- WHERE m.sender_id = 1 -- TOP Support 发送的消息
-- ORDER BY m.created_at DESC
-- LIMIT 5;

