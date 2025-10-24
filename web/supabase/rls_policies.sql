-- RLS setup script for Supabase (Postgres)
-- Execute in Supabase SQL editor (connected as service role)

-- =============================
-- Helper: create extension if not exists (for uuid generation etc.)
create extension if not exists "uuid-ossp";

-- =============================
-- USERS TABLE
alter table public.users enable row level security;

-- Authenticated users can select their own record
drop policy if exists "Users can view self" on public.users;
create policy "Users can view self" on public.users
  for select using (auth.uid() = supabase_user_id);

-- Allow service role (backend) to manage
drop policy if exists "Backend full access users" on public.users;
create policy "Backend full access users" on public.users
  for all using (auth.role() = 'service_role');

-- =============================
-- LISTINGS TABLE
alter table public.listings enable row level security;

-- Public can read listings
drop policy if exists "Listings public read" on public.listings;
create policy "Listings public read" on public.listings
  for select using (true);

-- Sellers can manage their own listings
drop policy if exists "Seller manage own listings" on public.listings;
create policy "Seller manage own listings" on public.listings
  for all using (auth.uid() = seller_id::text);

-- =============================
-- TRANSACTIONS TABLE
alter table public.transactions enable row level security;

-- Buyers and sellers can read their transactions
drop policy if exists "Transactions read own" on public.transactions;
create policy "Transactions read own" on public.transactions
  for select using (auth.uid() = buyer_id::text or auth.uid() = seller_id::text);

-- Backend full access
drop policy if exists "Backend manage transactions" on public.transactions;
create policy "Backend manage transactions" on public.transactions
  for all using (auth.role() = 'service_role');

-- =============================
-- REVIEWS TABLE
alter table public.reviews enable row level security;

drop policy if exists "Reviews public read" on public.reviews;
create policy "Reviews public read" on public.reviews
  for select using (true);

drop policy if exists "Reviews authored update" on public.reviews;
create policy "Reviews authored update" on public.reviews
  for all using (auth.uid() = reviewer_id::text);

-- Backend full access
drop policy if exists "Backend manage reviews" on public.reviews;
create policy "Backend manage reviews" on public.reviews
  for all using (auth.role() = 'service_role');

-- =============================
-- USER ADDRESSES TABLE
alter table public.user_addresses enable row level security;

-- Users can manage their own addresses
drop policy if exists "Users manage own addresses" on public.user_addresses;
create policy "Users manage own addresses" on public.user_addresses
  for all using (auth.uid() = (select supabase_user_id from users where id = user_addresses.user_id));

-- Backend full access
drop policy if exists "Backend full access user_addresses" on public.user_addresses;
create policy "Backend full access user_addresses" on public.user_addresses
  for all using (auth.role() = 'service_role');

-- =============================
-- USER PAYMENT METHODS TABLE
alter table public.user_payment_methods enable row level security;

-- Users can manage their own payment methods
drop policy if exists "Users manage own payment methods" on public.user_payment_methods;
create policy "Users manage own payment methods" on public.user_payment_methods
  for all using (auth.uid() = (select supabase_user_id from users where id = user_payment_methods.user_id));

-- Backend full access
drop policy if exists "Backend full access user_payment_methods" on public.user_payment_methods;
create policy "Backend full access user_payment_methods" on public.user_payment_methods
  for all using (auth.role() = 'service_role');

-- =============================
-- CART ITEMS TABLE
alter table public.cart_items enable row level security;

-- Users can manage their own cart items
drop policy if exists "Users manage own cart" on public.cart_items;
create policy "Users manage own cart" on public.cart_items
  for all using (auth.uid() = (select supabase_user_id from users where id = cart_items.user_id));

-- Backend full access
drop policy if exists "Backend full access cart_items" on public.cart_items;
create policy "Backend full access cart_items" on public.cart_items
  for all using (auth.role() = 'service_role');

-- =============================
-- ORDERS TABLE
alter table public.orders enable row level security;

-- Buyers and sellers can read their orders
drop policy if exists "Orders read own" on public.orders;
create policy "Orders read own" on public.orders
  for select using (auth.uid() = (select supabase_user_id from users where id = orders.buyer_id) or 
                   auth.uid() = (select supabase_user_id from users where id = orders.seller_id));

-- Backend full access
drop policy if exists "Backend manage orders" on public.orders;
create policy "Backend manage orders" on public.orders
  for all using (auth.role() = 'service_role');

-- =============================
-- ORDER ITEMS TABLE
alter table public.order_items enable row level security;

-- Users can read order items for their own orders
drop policy if exists "Order items read own" on public.order_items;
create policy "Order items read own" on public.order_items
  for select using (exists (
    select 1 from orders o 
    where o.id = order_items.order_id 
    and (auth.uid() = (select supabase_user_id from users where id = o.buyer_id) or 
         auth.uid() = (select supabase_user_id from users where id = o.seller_id))
  ));

-- Backend full access
create policy if not exists "Backend manage order_items" on public.order_items
  for all using (auth.role() = 'service_role');

-- =============================
-- FEEDBACK TABLE (updated)
alter table public.feedback enable row level security;

-- Public can read feedback
create policy if not exists "Feedback public read" on public.feedback
  for select using (true);

-- Users can create feedback
create policy if not exists "Users create feedback" on public.feedback
  for insert with check (auth.uid() = (select supabase_user_id from users where id = feedback.user_id));

-- Backend full access
create policy if not exists "Backend manage feedback" on public.feedback
  for all using (auth.role() = 'service_role');

-- =============================
-- FAQ TABLE (updated)
alter table public.faq enable row level security;

-- Public can read public FAQs
create policy if not exists "FAQ public read" on public.faq
  for select using (is_public = true);

-- Users can create FAQs
create policy if not exists "Users create FAQ" on public.faq
  for insert with check (auth.uid() = (select supabase_user_id from users where id = faq.user_id));

-- Backend full access
create policy if not exists "Backend manage FAQ" on public.faq
  for all using (auth.role() = 'service_role');

