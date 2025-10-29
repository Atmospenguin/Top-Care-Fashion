-- 为 reviews 表添加 images 字段
-- 在 Supabase Dashboard 的 SQL Editor 中运行

-- 1. 添加 images 字段（JSONB 类型）
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS images JSONB;

-- 2. 将 comment 字段改为可选（如果还没有改的话）
ALTER TABLE reviews ALTER COLUMN comment DROP NOT NULL;

-- 验证：检查字段是否添加成功
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'reviews' 
AND column_name IN ('images', 'comment');

