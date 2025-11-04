-- =========================================================
-- 📨 更新 Welcome Trigger 使用正确的 TOP Support ID (59)
-- Description: 
--   使用动态查找 TOP Support 用户 ID，避免硬编码
--   确保与环境变量 SUPPORT_USER_ID=59 保持一致
-- =========================================================

-- ⚙️ Step 1: 创建/更新触发器函数（动态查找 TOP Support）
CREATE OR REPLACE FUNCTION public.send_welcome_message()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  top_support_id int;
  new_conversation_id int;
  welcome_text text;
BEGIN
  -- 1️⃣ 动态查找 TOP Support 用户 ID（通过 username）
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
    WHERE (initiator_id = NEW.id AND participant_id = top_support_id)
       OR (initiator_id = top_support_id AND participant_id = NEW.id)
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
    is_read,
    created_at
  )
  VALUES (
    new_conversation_id,
    top_support_id,  -- sender = TOP Support (动态查找的 ID)
    NEW.id,          -- receiver = 新注册用户
    welcome_text,
    'TEXT',
    FALSE,           -- 新消息未读
    NOW()
  );
  
  -- 8️⃣ 更新对话的最后消息时间
  UPDATE public.conversations 
  SET last_message_at = NOW()
  WHERE id = new_conversation_id;
  
  RAISE NOTICE 'Welcome message sent to user % from TOP Support (ID: %) in conversation %', 
    NEW.username, top_support_id, new_conversation_id;
  
  RETURN NEW;
END;
$$;

-- ⚙️ Step 2: 重新创建触发器
DROP TRIGGER IF EXISTS on_user_created_send_welcome ON public.users;
CREATE TRIGGER on_user_created_send_welcome
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_message();

-- =========================================================
-- ✅ 完成！
-- 触发器现在会：
--   1. 动态查找 username='TOP Support' 的用户 ID（应该是 59）
--   2. 检查是否已存在对话（避免重复）
--   3. 为新用户创建 Support 对话
--   4. 发送欢迎消息
-- =========================================================

-- 📝 验证触发器（可选）
SELECT 
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'send_welcome_message';

