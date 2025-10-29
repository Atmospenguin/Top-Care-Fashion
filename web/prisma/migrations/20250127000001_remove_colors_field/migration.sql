-- Migration: Remove colors field from listings table
-- 删除商品表中的colors字段

-- 检查colors字段是否存在，如果存在则删除
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'listings' 
        AND column_name = 'colors'
    ) THEN
        ALTER TABLE listings DROP COLUMN colors;
        RAISE NOTICE 'Colors column removed from listings table';
    ELSE
        RAISE NOTICE 'Colors column does not exist in listings table';
    END IF;
END $$;
