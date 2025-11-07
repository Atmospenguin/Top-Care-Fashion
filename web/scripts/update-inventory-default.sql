-- 修改 inventory_count 列的默认值从 0 改为 1
ALTER TABLE listings 
  ALTER COLUMN inventory_count SET DEFAULT 1;

-- 验证修改
SELECT column_name, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'listings' 
  AND column_name = 'inventory_count';

