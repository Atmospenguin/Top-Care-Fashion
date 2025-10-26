-- 添加使用次数计数器到 users 表
ALTER TABLE users ADD COLUMN IF NOT EXISTS mix_match_used_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS free_promotions_used INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS free_promotions_reset_at TIMESTAMPTZ;

-- 添加注释
COMMENT ON COLUMN users.mix_match_used_count IS 'Mix & Match AI 使用次数（Free用户限制3次）';
COMMENT ON COLUMN users.free_promotions_used IS '本月已使用的免费 promotion 次数（Premium用户每月3次）';
COMMENT ON COLUMN users.free_promotions_reset_at IS '免费 promotion 重置时间（每月1号重置）';

-- 为现有用户初始化计数器
UPDATE users 
SET mix_match_used_count = 0,
    free_promotions_used = 0
WHERE mix_match_used_count IS NULL;
