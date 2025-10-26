-- 添加买家信息字段到 orders 表
-- 这些字段已经在 Prisma schema 中定义，但需要手动添加到数据库中

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS buyer_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS buyer_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS shipping_address TEXT,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_details JSONB;

-- 验证字段是否添加成功
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('buyer_name', 'buyer_phone', 'shipping_address', 'payment_method', 'payment_details')
ORDER BY column_name;
