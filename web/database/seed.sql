-- Seed data for Top Care Fashion

INSERT INTO users (username, email, role, status, is_premium) VALUES
  ('alice','alice@example.com','User','active', 1),
  ('bob','bob@example.com','User','suspended', 0),
  ('admin','admin@topcarefashion.com','Admin','active', 0)
ON DUPLICATE KEY UPDATE role=VALUES(role), status=VALUES(status), is_premium=VALUES(is_premium);

INSERT INTO product_categories (name, description) VALUES
  ('Tops', 'Shirts, blouses, t-shirts, and upper body clothing'),
  ('Bottoms', 'Pants, jeans, skirts, and lower body clothing'),
  ('Outerwear', 'Jackets, coats, blazers, and outer layers'),
  ('Dresses', 'Dresses and jumpsuits'),
  ('Shoes', 'Footwear of all types'),
  ('Accessories', 'Bags, jewelry, belts, and other accessories')
ON DUPLICATE KEY UPDATE description=VALUES(description);

-- Insert sample products with enhanced data
INSERT INTO products (name, description, category_id, seller_id, listed, price, image_url, brand, size, condition_type, tags) VALUES
  ('Classic White Tee', 'A timeless white cotton t-shirt perfect for any occasion', 1, 1, 1, 19.99, '/api/placeholder/300/400', 'Uniqlo', 'M', 'like_new', '["basic", "cotton", "casual"]'),
  ('Denim Jacket', 'Vintage-style denim jacket with classic fit', 3, 1, 1, 59.99, '/api/placeholder/300/400', 'Levi\'s', 'L', 'good', '["denim", "vintage", "outerwear"]'),
  ('Black Slim Jeans', 'Comfortable slim-fit black jeans for everyday wear', 2, 1, 1, 39.99, '/api/placeholder/300/400', 'H&M', '32', 'good', '["jeans", "slim-fit", "black"]'),
  ('Floral Summer Dress', 'Light and airy floral dress perfect for summer', 4, 1, 1, 45.00, '/api/placeholder/300/400', 'Zara', 'S', 'new', '["floral", "summer", "dress"]'),
  ('Leather Boots', 'Durable leather boots with comfortable sole', 5, 1, 1, 89.99, '/api/placeholder/300/400', 'Dr. Martens', '9', 'like_new', '["leather", "boots", "durable"]');

-- create a transaction for review linkage
INSERT INTO transactions (buyer_id, seller_id, product_id, quantity, price_each, status)
VALUES (1, 2, 2, 1, 59.99, 'completed')
ON DUPLICATE KEY UPDATE status=VALUES(status);

INSERT INTO reviews (product_id, author, author_user_id, rating, comment, transaction_id) VALUES
  (1,'alice',1,5,'Love this tee! Perfect fit and quality.', NULL),
  (2,'bob',2,4,'Great jacket, exactly as described.', 1);

INSERT INTO feedback (user_email, message) VALUES
  ('user1@example.com','Great app! Love the AI features.'),
  ('user2@example.com','Please add dark mode and more size options.');

INSERT INTO faq (question, answer, answered_at) VALUES
  ('How to list a product?','Go to the marketplace and click "Add Product" as an admin, or use the mobile app Sell tab.', NOW()),
  ('What is the refund policy?', 'We offer full refunds within 7 days of purchase if the item doesn\'t match the description.', NOW()),
  ('How does Mix & Match AI work?', 'Our AI analyzes your listed items and suggests outfit combinations based on style, color, and occasion.', NOW()),
  ('What are the commission rates?', 'Free users pay 10% commission, Premium users pay only 5% commission per sale.', NOW());

-- Insert testimonials (migrated from static data)
INSERT INTO testimonials (user_name, text, rating, tags, featured, created_at) VALUES 
('Ava', 'Mix & Match nailed my vibe in minutes.', 5, '["mixmatch"]', 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
('Leo', 'AI Listing wrote better titles than I do.', 5, '["ailisting"]', 1, DATE_SUB(NOW(), INTERVAL 5 DAY)),
('Mia', 'Premium perks are worth it for frequent sellers.', 5, '["premium"]', 1, DATE_SUB(NOW(), INTERVAL 7 DAY)),
('Kai', 'Found full outfits with Mix & Match.', 4, '["mixmatch"]', 1, DATE_SUB(NOW(), INTERVAL 19 DAY)),
('Zoe', 'AI Listing saved me tons of time.', 5, '["ailisting"]', 1, DATE_SUB(NOW(), INTERVAL 25 DAY)),
('Emma', 'The app is intuitive and stylish.', 5, '["premium"]', 1, DATE_SUB(NOW(), INTERVAL 10 DAY)),
('Ryan', 'Perfect for finding unique pieces.', 4, '["mixmatch"]', 1, DATE_SUB(NOW(), INTERVAL 15 DAY)),
('Sofia', 'Love the AI recommendations!', 5, '["ailisting", "mixmatch"]', 1, DATE_SUB(NOW(), INTERVAL 8 DAY));

-- Insert site statistics
INSERT INTO site_stats (total_downloads, total_listings, total_sold, avg_rating) VALUES 
(12000, 38000, 9400, 4.8)
ON DUPLICATE KEY UPDATE 
  total_downloads=VALUES(total_downloads), 
  total_listings=VALUES(total_listings), 
  total_sold=VALUES(total_sold), 
  avg_rating=VALUES(avg_rating);

-- Insert pricing plans (migrated from static data)
INSERT INTO pricing_plans (
  plan_type, name, description, price_monthly, price_quarterly, price_annual,
  listing_limit, promotion_price, promotion_discount, commission_rate, 
  mixmatch_limit, free_promotion_credits, seller_badge, features, is_popular
) VALUES 
(
  'free', 'Free', '$0 / month', 0.00, NULL, NULL,
  2, 2.90, NULL, 10.00, 
  3, 0, NULL, 
  '["Up to 2 active listings", "Promotion: $2.90 / 3-day", "Free promo credits: None", "Commission: 10% per sale", "Mix & Match AI: 3 total uses", "Seller badge: None", "Payment options: Free"]',
  0
),
(
  'premium', 'Premium', 'Monthly / Quarterly / Annual', 6.90, 18.90, 59.90,
  NULL, 2.00, 30.00, 5.00,
  NULL, 3, 'Premium Badge',
  '["Unlimited listings", "Promotion: $2.00 / 3-day (30% off)", "First 3 listings: 3 days free promotion", "Commission: 5% per sale", "Mix & Match AI: Unlimited usage & saves", "Seller badge: Premium badge on profile & listings", "Pricing: 1 mo $6.90 · 3 mo $18.90 ($6.30/mo) · 12 mo $59.90 ($4.99/mo)"]',
  1
);

INSERT INTO landing_content (id, hero_title, hero_subtitle)
VALUES (1, 'Discover outfits powered by AI', 'Mix & Match is an AI outfit recommender that builds looks from listed items. Snap, list, and get smart suggestions instantly.')
ON DUPLICATE KEY UPDATE hero_title=VALUES(hero_title), hero_subtitle=VALUES(hero_subtitle);

INSERT INTO reports (target_type, target_id, reporter, reason, status)
VALUES
  ('product','1','alice@example.com','Fake brand', 'open'),
  ('user','2','charlie@example.com','Abusive behavior', 'open');
