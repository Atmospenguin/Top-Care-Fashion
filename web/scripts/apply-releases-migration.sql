-- Manual SQL script to create releases table
-- Run this in your database if Prisma migrations don't work

-- Create releases table
CREATE TABLE IF NOT EXISTS releases (
  id SERIAL PRIMARY KEY,
  version VARCHAR(50) NOT NULL,
  platform VARCHAR(20) NOT NULL,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT,
  release_notes TEXT,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_releases_platform ON releases(platform);
CREATE INDEX IF NOT EXISTS idx_releases_current ON releases(is_current);

-- Create unique constraint for version + platform
CREATE UNIQUE INDEX IF NOT EXISTS idx_releases_version_platform ON releases(version, platform);

-- Verify the table was created
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'releases'
ORDER BY 
  ordinal_position;

