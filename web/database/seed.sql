USE marketplace;

-- Insert categories (3 fixed ones)
INSERT INTO categories (name) VALUES 
('Top'),
('Bottom'),
('Footwear');

-- Insert users
INSERT INTO users (email, password_hash, role, status) VALUES
('alice@example.com', 'hashedpassword1', 'user', 'active'),
('bob@example.com', 'hashedpassword2', 'user', 'active'),
('admin@example.com', 'hashedpassword3', 'admin', 'active');

-- Insert user profiles
INSERT INTO user_profiles (user_id, display_name, avatar_url, bio, phone_number, preferences) VALUES
(1, 'Alice', 'https://example.com/alice.jpg', 'Fashion lover who sells vintage clothing.', '1234567890', '{"style":"casual"}'),
(2, 'Bob', 'https://example.com/bob.jpg', 'Sneakerhead and streetwear collector.', '0987654321', '{"style":"streetwear"}'),
(3, 'Admin', 'https://example.com/admin.jpg', 'Marketplace admin account.', '1112223333', '{"role":"management"}');

-- Insert items (catalog)
INSERT INTO items (name, brand, category_id, description, base_price) VALUES
('Classic White Tee', 'Uniqlo', 1, 'A versatile classic white tee.', 19.99),
('Black Slim Jeans', 'Levi''s', 2, 'Slim fit black jeans, durable and stylish.', 39.99),
('Running Sneakers', 'Nike', 3, 'Comfortable sneakers for running and daily wear.', 79.99);

-- Insert listings
INSERT INTO listings (item_id, seller_user_id, listing_price, item_condition, status) VALUES
(1, 1, 15.00, 'used', 'active'),   -- Alice selling a white tee
(2, 1, 35.00, 'used', 'active'),   -- Alice selling jeans
(3, 2, 75.00, 'new', 'active');    -- Bob selling sneakers

-- Insert listing images
INSERT INTO listing_images (listing_id, url, sort_order) VALUES
(1, 'https://example.com/white-tee1.jpg', 1),
(1, 'https://example.com/white-tee2.jpg', 2),
(2, 'https://example.com/jeans.jpg', 1),
(3, 'https://example.com/sneakers.jpg', 1);

-- Insert reviews (on listings)
INSERT INTO reviews (listing_id, author_user_id, rating, content) VALUES
(1, 2, 5, 'Great quality tee, fast shipping!'),
(2, 2, 4, 'Jeans were slightly worn, but good value.');

-- Insert seller ratings
INSERT INTO seller_ratings (seller_user_id, rater_user_id, rating, comment) VALUES
(1, 2, 5, 'Alice is a reliable seller.'),
(2, 1, 4, 'Bob was responsive and helpful.');

-- Insert transactions
INSERT INTO transactions (buyer_id, seller_id, listing_id, amount, payment_method, status) VALUES
(2, 1, 1, 15.00, 'paypal', 'completed'),
(1, 2, 3, 75.00, 'credit_card', 'pending');
