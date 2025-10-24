-- =========================================================
-- 📨 修复版 Welcome Trigger for New Users
-- Author: Cheng Zhenxi / TOP Care Fashion
-- Description:
--   自动为新用户创建与 TOP Support 的对话和欢迎消息
--   使用动态查找 TOP Support 用户 ID，避免硬编码
-- =========================================================

-- ⚙️ Step 1: 创建触发器函数（动态查找 TOP Support ID）
CREATE OR REPLACE FUNCTION public.send_welcome_message()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  top_support_id int;
  new_conversation_id int;
  welcome_text text;
BEGIN
  -- 1️⃣ 动态查找 TOP Support 用户 ID
  SELECT id INTO top_support_id 
  FROM public.users 
  WHERE username = 'TOP Support' 
  LIMIT 1;
  
  -- 2️⃣ 如果找不到 TOP Support 用户，跳过
  IF top_support_id IS NULL THEN
    RAISE NOTICE 'TOP Support user not found, skipping welcome message';
    RETURN NEW;
  END IF;
  
  -- 3️⃣ 确保不对 TOP Support 自己触发
  IF NEW.id = top_support_id THEN
    RETURN NEW;
  END IF;
  
  -- 4️⃣ 检查是否已存在对话，避免重复创建
  IF EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE initiator_id = NEW.id 
    AND participant_id = top_support_id 
    AND type = 'SUPPORT'
  ) THEN
    RAISE NOTICE 'Support conversation already exists for user %', NEW.username;
    RETURN NEW;
  END IF;
  
  -- 5️⃣ 创建 conversation 记录
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
  
  -- 6️⃣ 构建欢迎文本
  welcome_text := format('Hey @%s, Welcome to TOP! 👋', NEW.username);
  
  -- 7️⃣ 插入欢迎消息
  INSERT INTO public.messages (
    conversation_id,
    sender_id,
    receiver_id,
    content,
    message_type,
    created_at
  )
  VALUES (
    new_conversation_id,
    top_support_id,  -- sender = TOP Support
    NEW.id,          -- receiver = 新注册用户
    welcome_text,
    'TEXT',
    NOW()
  );
  
  -- 8️⃣ 更新对话的最后消息时间
  UPDATE public.conversations 
  SET last_message_at = NOW()
  WHERE id = new_conversation_id;
  
  RAISE NOTICE 'Welcome message sent to user % (conversation_id: %)', NEW.username, new_conversation_id;
  
  RETURN NEW;
END;
$$;

-- ⚙️ Step 2: 创建触发器
DROP TRIGGER IF EXISTS on_user_created_send_welcome ON public.users;
CREATE TRIGGER on_user_created_send_welcome
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_message();

-- =========================================================
-- ✅ Done! 每当有新用户注册（insert into users），
-- 系统会自动：
--   1. 动态查找 TOP Support 用户 ID
--   2. 检查是否已存在对话（避免重复）
--   3. 创建一条 Support 会话
--   4. 发送欢迎消息到 messages 表
-- =========================================================
