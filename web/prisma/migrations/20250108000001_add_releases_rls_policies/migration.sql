-- Migration: Add Row Level Security policies for releases table
-- 为releases表添加行级安全策略

-- Enable RLS on releases table (if not already enabled)
-- 启用RLS（如果尚未启用）
ALTER TABLE releases ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to ensure clean state)
-- 删除现有策略（如果有）以确保干净状态
DROP POLICY IF EXISTS "Public can read releases" ON releases;
DROP POLICY IF EXISTS "Service role can manage releases" ON releases;
DROP POLICY IF EXISTS "Releases public read" ON releases;
DROP POLICY IF EXISTS "Backend manage releases" ON releases;

-- Policy 1: Allow public read access to all releases
-- 策略1：允许公开读取所有版本信息
-- This enables the landing page to fetch current releases for download
-- 这使得落地页可以获取当前版本用于下载
CREATE POLICY "Public can read releases" ON releases
  FOR SELECT USING (true);

-- Policy 2: Allow authenticated service role full access
-- 策略2：允许认证的服务角色完全访问
-- This enables admin operations (create, update, delete) via API routes
-- 这使得管理员可以通过API路由进行创建、更新、删除操作
CREATE POLICY "Service role can manage releases" ON releases
  FOR ALL USING (auth.role() = 'service_role');
