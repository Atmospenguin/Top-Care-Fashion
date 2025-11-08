-- AlterTable
ALTER TABLE "saved_outfits" ADD COLUMN IF NOT EXISTS "color_harmony_score" INTEGER,
ADD COLUMN IF NOT EXISTS "color_harmony_feedback" TEXT,
ADD COLUMN IF NOT EXISTS "style_tips" TEXT,
ADD COLUMN IF NOT EXISTS "vibe" VARCHAR(50);

