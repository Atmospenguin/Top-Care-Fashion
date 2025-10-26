-- 添加 payment_method_id 到 orders 表
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method_id INTEGER;

-- 添加外键约束（可选，SetNull on delete）
ALTER TABLE orders 
  ADD CONSTRAINT fk_orders_payment_method 
  FOREIGN KEY (payment_method_id) 
  REFERENCES user_payment_methods(id) 
  ON DELETE SET NULL;

-- 添加索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_orders_payment_method_id ON orders(payment_method_id);
