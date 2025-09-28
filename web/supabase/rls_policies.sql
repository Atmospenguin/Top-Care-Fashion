-- RLS setup script for Supabase (Postgres)
-- Execute in Supabase SQL editor (connected as service role)

-- =============================
-- Helper: create extension if not exists (for uuid generation etc.)
create extension if not exists "uuid-ossp";

-- =============================
-- USERS TABLE
alter table public.users enable row level security;

-- Authenticated users can select their own record
create policy if not exists "Users can view self" on public.users
  for select using (auth.uid() = supabase_user_id);

-- Allow service role (backend) to manage
create policy if not exists "Backend full access users" on public.users
  for all using (auth.role() = 'service_role');

-- =============================
-- LISTINGS TABLE
alter table public.listings enable row level security;

-- Public can read listings
create policy if not exists "Listings public read" on public.listings
  for select using (true);

-- Sellers can manage their own listings
create policy if not exists "Seller manage own listings" on public.listings
  for all using (auth.uid() = seller_id::text);

-- =============================
-- TRANSACTIONS TABLE
alter table public.transactions enable row level security;

-- Buyers and sellers can read their transactions
create policy if not exists "Transactions read own" on public.transactions
  for select using (auth.uid() = buyer_id::text or auth.uid() = seller_id::text);

-- Backend full access
create policy if not exists "Backend manage transactions" on public.transactions
  for all using (auth.role() = 'service_role');

-- =============================
-- REVIEWS TABLE
alter table public.reviews enable row level security;

create policy if not exists "Reviews public read" on public.reviews
  for select using (true);

create policy if not exists "Reviews authored update" on public.reviews
  for all using (auth.uid() = reviewer_id::text);

-- Backend full access
create policy if not exists "Backend manage reviews" on public.reviews
  for all using (auth.role() = 'service_role');


