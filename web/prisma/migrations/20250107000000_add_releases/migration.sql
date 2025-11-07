-- Migration: Add releases table for app download management
-- 添加releases表用于管理应用下载

CREATE TABLE IF NOT EXISTS releases (
  id SERIAL PRIMARY KEY,
  version VARCHAR(50) NOT NULL,
  platform VARCHAR(20) NOT NULL, -- 'android' or 'ios'
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT,
  release_notes TEXT,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_releases_platform ON releases(platform);
CREATE INDEX IF NOT EXISTS idx_releases_current ON releases(is_current);

-- Add unique constraint for version + platform
CREATE UNIQUE INDEX IF NOT EXISTS idx_releases_version_platform ON releases(version, platform);

