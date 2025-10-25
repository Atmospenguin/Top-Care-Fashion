-- Migration: Update database schema for mobile app support
-- 根据mobile应用需求更新数据库结构

-- 1. 添加新的枚举类型
CREATE TYPE "PaymentMethodType" AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'APPLE_PAY', 'GOOGLE_PAY');
CREATE TYPE "AddressType" AS ENUM ('HOME', 'WORK', 'OTHER');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');
CREATE TYPE "CartItemStatus" AS ENUM ('ACTIVE', 'REMOVED', 'PURCHASED');

-- 2. 更新用户表，添加mobile应用需要的字段
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location VARCHAR(100),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ(6) DEFAULT NOW();

-- 3. 更新商品分类表，添加层级支持
ALTER TABLE listing_categories 
ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS icon_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES listing_categories(id),
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 4. 更新商品表，添加mobile应用需要的字段
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS material VARCHAR(100),
ADD COLUMN IF NOT EXISTS weight DECIMAL(8, 2),
ADD COLUMN IF NOT EXISTS dimensions JSONB,
ADD COLUMN IF NOT EXISTS sku VARCHAR(50),
ADD COLUMN IF NOT EXISTS inventory_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ(6) DEFAULT NOW();

-- 5. 创建用户地址表
CREATE TABLE IF NOT EXISTS user_addresses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type "AddressType" DEFAULT 'HOME',
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  line1 VARCHAR(200) NOT NULL,
  line2 VARCHAR(200),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);

-- 6. 创建用户支付方式表
CREATE TABLE IF NOT EXISTS user_payment_methods (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type "PaymentMethodType" NOT NULL,
  label VARCHAR(100) NOT NULL,
  brand VARCHAR(50),
  last4 VARCHAR(4),
  expiry_month INTEGER,
  expiry_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_payment_methods_user_id ON user_payment_methods(user_id);

-- 7. 创建购物车表
CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  status "CartItemStatus" DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_listing_id ON cart_items(listing_id);

-- 8. 创建订单表
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  address_id INTEGER NOT NULL REFERENCES user_addresses(id) ON DELETE RESTRICT,
  payment_method_id INTEGER REFERENCES user_payment_methods(id) ON DELETE SET NULL,
  status "OrderStatus" DEFAULT 'PENDING',
  subtotal DECIMAL(10, 2) NOT NULL,
  shipping_fee DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_status VARCHAR(20) DEFAULT 'pending',
  shipping_method VARCHAR(50),
  tracking_number VARCHAR(100),
  estimated_delivery TIMESTAMPTZ(6),
  notes TEXT,
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
  shipped_at TIMESTAMPTZ(6),
  delivered_at TIMESTAMPTZ(6)
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- 9. 创建订单项表
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ(6) DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_listing_id ON order_items(listing_id);

-- 10. 更新交易表，添加订单关联
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ(6) DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);

-- 11. 更新评价表，添加更多字段
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ(6) DEFAULT NOW();

-- 12. 更新反馈表，添加mobile应用需要的字段
ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS title VARCHAR(200),
ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'open',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ(6) DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);

-- 13. 更新FAQ表，添加分类支持
ALTER TABLE faq 
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_faq_category ON faq(category);

-- 14. 更新举报表，添加更多字段
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_reports_target_type ON reports(target_type);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- 15. 添加触发器来更新updated_at字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为相关表添加触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_listings_updated_at ON listings;
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_addresses_updated_at ON user_addresses;
CREATE TRIGGER update_user_addresses_updated_at BEFORE UPDATE ON user_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_payment_methods_updated_at ON user_payment_methods;
CREATE TRIGGER update_user_payment_methods_updated_at BEFORE UPDATE ON user_payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_feedback_updated_at ON feedback;
CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 16. 插入一些示例数据
INSERT INTO listing_categories (name, slug, description, is_active) VALUES
('Tops', 'tops', 'Shirts, blouses, sweaters, and other upper body garments', TRUE),
('Bottoms', 'bottoms', 'Pants, skirts, shorts, and other lower body garments', TRUE),
('Shoes', 'shoes', 'Footwear for all occasions', TRUE),
('Accessories', 'accessories', 'Bags, jewelry, belts, and other accessories', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- 17. 更新RLS策略
-- 用户地址RLS
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own addresses" ON user_addresses;
CREATE POLICY "Users can manage own addresses" ON user_addresses
  FOR ALL USING (auth.uid()::text = (SELECT supabase_user_id FROM users WHERE id = user_addresses.user_id)::text);

-- 用户支付方式RLS
ALTER TABLE user_payment_methods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own payment methods" ON user_payment_methods;
CREATE POLICY "Users can manage own payment methods" ON user_payment_methods
  FOR ALL USING (auth.uid()::text = (SELECT supabase_user_id FROM users WHERE id = user_payment_methods.user_id)::text);

-- 购物车RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own cart" ON cart_items;
CREATE POLICY "Users can manage own cart" ON cart_items
  FOR ALL USING (auth.uid()::text = (SELECT supabase_user_id FROM users WHERE id = cart_items.user_id)::text);

-- 订单RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid()::text = (SELECT supabase_user_id FROM users WHERE id = orders.buyer_id)::text OR 
                   auth.uid()::text = (SELECT supabase_user_id FROM users WHERE id = orders.seller_id)::text);

-- 订单项RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view order items for own orders" ON order_items;
CREATE POLICY "Users can view order items for own orders" ON order_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM orders o 
    WHERE o.id = order_items.order_id 
    AND (auth.uid()::text = (SELECT supabase_user_id FROM users WHERE id = o.buyer_id)::text OR 
         auth.uid()::text = (SELECT supabase_user_id FROM users WHERE id = o.seller_id)::text)
  ));
