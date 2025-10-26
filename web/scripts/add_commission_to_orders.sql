-- 添加佣金相关字段到 orders 表
ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5, 4);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10, 2);

-- 添加注释
COMMENT ON COLUMN orders.commission_rate IS '佣金率（如 0.05 = 5%, 0.10 = 10%）';
COMMENT ON COLUMN orders.commission_amount IS '佣金金额（基于订单金额计算）';

-- 为历史订单补充佣金数据（假设都是普通用户的 10%）
-- UPDATE orders 
-- SET commission_rate = 0.10,
--     commission_amount = total_amount * 0.10
-- WHERE commission_rate IS NULL AND total_amount IS NOT NULL;
