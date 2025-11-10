-- =============================
-- RLS POLICIES BUG FIXES
-- =============================
-- This script fixes the incorrect UUID to INT comparison in existing RLS policies
-- Execute this in Supabase SQL editor (connected as service role)
--
-- Problem: seller_id, buyer_id, reviewer_id are INT type
--          auth.uid() returns UUID type
--          Direct comparison (auth.uid() = seller_id::text) doesn't work correctly
--
-- Solution: Compare auth.uid() with users.supabase_user_id by joining through the INT id

-- =============================
-- FIX 1: LISTINGS TABLE
-- =============================
-- Original buggy policy at line 34:
-- create policy "Seller manage own listings" on public.listings
--   for all using (auth.uid() = seller_id::text);

DROP POLICY IF EXISTS "Seller manage own listings" ON public.listings;
CREATE POLICY "Seller manage own listings" ON public.listings
  FOR ALL USING (
    auth.uid() = (SELECT supabase_user_id FROM users WHERE id = listings.seller_id)
  );

-- =============================
-- FIX 2: TRANSACTIONS TABLE
-- =============================
-- Original buggy policy at line 43:
-- create policy "Transactions read own" on public.transactions
--   for select using (auth.uid() = buyer_id::text or auth.uid() = seller_id::text);

DROP POLICY IF EXISTS "Transactions read own" ON public.transactions;
CREATE POLICY "Transactions read own" ON public.transactions
  FOR SELECT USING (
    auth.uid() = (SELECT supabase_user_id FROM users WHERE id = transactions.buyer_id) OR
    auth.uid() = (SELECT supabase_user_id FROM users WHERE id = transactions.seller_id)
  );

-- =============================
-- FIX 3: REVIEWS TABLE
-- =============================
-- Original buggy policy at line 60:
-- create policy "Reviews authored update" on public.reviews
--   for all using (auth.uid() = reviewer_id::text);

DROP POLICY IF EXISTS "Reviews authored update" ON public.reviews;
CREATE POLICY "Reviews authored update" ON public.reviews
  FOR ALL USING (
    auth.uid() = (SELECT supabase_user_id FROM users WHERE id = reviews.reviewer_id)
  );

-- =============================
-- VERIFICATION QUERIES
-- =============================
-- After applying fixes, verify that policies are correctly set:

-- 1. Check listings policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'listings'
ORDER BY policyname;

-- 2. Check transactions policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'transactions'
ORDER BY policyname;

-- 3. Check reviews policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'reviews'
ORDER BY policyname;

-- =============================
-- PERFORMANCE OPTIMIZATION
-- =============================
-- Ensure users.supabase_user_id has an index for optimal performance

CREATE INDEX IF NOT EXISTS idx_users_supabase_user_id
ON public.users(supabase_user_id);

-- =============================
-- TEST SCRIPT (OPTIONAL)
-- =============================
-- Uncomment and modify to test the policies:

/*
-- Test as authenticated user
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "your-test-uuid-here"}';

-- Test listings access (should only see own listings for INSERT/UPDATE/DELETE)
SELECT * FROM listings WHERE seller_id = 1; -- Replace with your user's INT id

-- Test transactions access (should only see own transactions)
SELECT * FROM transactions WHERE buyer_id = 1 OR seller_id = 1;

-- Test reviews access (should only manage own reviews)
SELECT * FROM reviews WHERE reviewer_id = 1;

-- Reset role
RESET role;
*/
