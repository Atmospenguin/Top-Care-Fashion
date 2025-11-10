-- Migration: Fix RLS policies UUID to INT comparison and add service_role policies
-- Date: 2025-11-10
-- Description: 
--   1. Fix incorrect UUID to INT comparison in RLS policies (listings, transactions, reviews)
--   2. Add service_role policy for listings table
--   3. Enable RLS and add policies for transactions and reviews tables
--   4. Add performance index on users.supabase_user_id

-- =============================
-- PERFORMANCE OPTIMIZATION
-- =============================
-- Ensure users.supabase_user_id has an index for optimal performance
CREATE INDEX IF NOT EXISTS idx_users_supabase_user_id
ON public.users(supabase_user_id);

-- =============================
-- FIX 1: LISTINGS TABLE
-- =============================
-- Fix seller ownership check to use correct UUID comparison
DROP POLICY IF EXISTS "Seller manage own listings" ON public.listings;
CREATE POLICY "Seller manage own listings" ON public.listings
  FOR ALL USING (
    auth.uid() = (SELECT supabase_user_id FROM users WHERE id = listings.seller_id)
  );

-- Add service_role policy for backend/admin access
DROP POLICY IF EXISTS "Backend full access listings" ON public.listings;
CREATE POLICY "Backend full access listings" ON public.listings
  FOR ALL USING (auth.role() = 'service_role');

-- =============================
-- FIX 2: TRANSACTIONS TABLE
-- =============================
-- Enable RLS if not already enabled
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Fix transaction access control to use correct UUID comparison
DROP POLICY IF EXISTS "Transactions read own" ON public.transactions;
CREATE POLICY "Transactions read own" ON public.transactions
  FOR SELECT USING (
    auth.uid() = (SELECT supabase_user_id FROM users WHERE id = transactions.buyer_id) OR
    auth.uid() = (SELECT supabase_user_id FROM users WHERE id = transactions.seller_id)
  );

-- Add service_role policy for backend/admin access
DROP POLICY IF EXISTS "Backend manage transactions" ON public.transactions;
CREATE POLICY "Backend manage transactions" ON public.transactions
  FOR ALL USING (auth.role() = 'service_role');

-- =============================
-- FIX 3: REVIEWS TABLE
-- =============================
-- Enable RLS if not already enabled
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Add public read policy
DROP POLICY IF EXISTS "Reviews public read" ON public.reviews;
CREATE POLICY "Reviews public read" ON public.reviews
  FOR SELECT USING (true);

-- Fix review authorship verification to use correct UUID comparison
DROP POLICY IF EXISTS "Reviews authored update" ON public.reviews;
CREATE POLICY "Reviews authored update" ON public.reviews
  FOR ALL USING (
    auth.uid() = (SELECT supabase_user_id FROM users WHERE id = reviews.reviewer_id)
  );

-- Add service_role policy for backend/admin access
DROP POLICY IF EXISTS "Backend manage reviews" ON public.reviews;
CREATE POLICY "Backend manage reviews" ON public.reviews
  FOR ALL USING (auth.role() = 'service_role');

