-- ✅ 添加 conversation_id 字段到 notifications 表
-- 在 Supabase SQL Editor 中执行此文件

-- Step 1: 添加 conversation_id 列
ALTER TABLE notifications 
ADD COLUMN conversation_id INTEGER;

-- Step 2: 添加外键约束
ALTER TABLE notifications 
ADD CONSTRAINT notifications_conversation_id_fkey 
FOREIGN KEY (conversation_id) 
REFERENCES conversations(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Step 3: 创建索引（提升查询性能）
CREATE INDEX idx_notifications_conversation_id 
ON notifications(conversation_id);

-- ✅ 验证迁移
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
AND column_name = 'conversation_id';


