const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function initializeDatabase() {
  try {
    console.log('Starting database initialization...');
    
    // Step 1: Connect to MySQL server (without specific database)
    const rootConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    };

    console.log('Connecting to MySQL server...');
    let connection = await mysql.createConnection(rootConfig);
    
    // Step 2: Create database if it doesn't exist
    console.log('Creating database...');
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`top_care_fashion\` 
      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.end();
    
    // Step 3: Connect to the specific database
    const dbConfig = {
      ...rootConfig,
      database: 'top_care_fashion'
    };

    console.log('Connecting to top_care_fashion database...');
    connection = await mysql.createConnection(dbConfig);
    
    // Step 4: Execute main schema
    console.log('Creating main tables...');
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const schemaContent = await fs.readFile(schemaPath, 'utf8');
    
    // Remove CREATE DATABASE and USE statements since we're already connected
    const cleanSchema = schemaContent
      .replace(/CREATE DATABASE.*?;/gi, '')
      .replace(/USE.*?;/gi, '');
    
    const schemaStatements = cleanSchema.split(';').filter(stmt => stmt.trim());
    
    for (const statement of schemaStatements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
        } catch (error) {
          console.log(`Skipping statement (might already exist): ${statement.substring(0, 50)}...`);
        }
      }
    }
    
    // Step 5: Insert sample content data
    console.log('Inserting additional content...');
    
    // Clear existing content to avoid duplicates
    try {
      await connection.execute('DELETE FROM feedback WHERE feedback_type = "testimonial"');
      await connection.execute('DELETE FROM site_stats');
      await connection.execute('DELETE FROM pricing_plans');
      console.log('Cleared existing content data');
    } catch (error) {
      console.log('No existing content to clear');
    }
    
    // Insert extensive testimonials and feedback into unified feedback system
    try {
      await connection.execute(`
        INSERT INTO feedback (user_name, user_email, message, rating, tags, featured, feedback_type, created_at) VALUES 
        -- Featured Testimonials
        ('Ava Chen', NULL, 'Mix & Match nailed my vibe in minutes. The AI suggestions are surprisingly accurate!', 5, '["mixmatch", "ai"]', 1, 'testimonial', DATE_SUB(NOW(), INTERVAL 2 DAY)),
        ('Leo Martinez', NULL, 'AI Listing wrote better titles than I do. Saved me hours of work every week.', 5, '["ailisting", "productivity"]', 1, 'testimonial', DATE_SUB(NOW(), INTERVAL 5 DAY)),
        ('Mia Johnson', NULL, 'Premium perks are worth it for frequent sellers. The commission reduction pays for itself.', 5, '["premium", "savings"]', 1, 'testimonial', DATE_SUB(NOW(), INTERVAL 7 DAY)),
        ('Kai Nakamura', NULL, 'Found full outfits with Mix & Match. Love how it combines pieces I never thought would work together.', 4, '["mixmatch", "outfits"]', 1, 'testimonial', DATE_SUB(NOW(), INTERVAL 19 DAY)),
        ('Zoe Williams', NULL, 'AI Listing saved me tons of time. The descriptions are professional and engaging.', 5, '["ailisting", "time-saving"]', 1, 'testimonial', DATE_SUB(NOW(), INTERVAL 25 DAY)),
        ('Emma Rodriguez', NULL, 'The platform is so user-friendly. Sold my first item within 24 hours!', 5, '["platform", "easy-use"]', 1, 'testimonial', DATE_SUB(NOW(), INTERVAL 10 DAY)),
        ('Ryan Thompson', NULL, 'Mix & Match helped me discover my personal style. The combinations are always on point.', 5, '["mixmatch", "style"]', 1, 'testimonial', DATE_SUB(NOW(), INTERVAL 15 DAY)),
        ('Sofia Garcia', NULL, 'Premium badge really makes a difference. Buyers trust my listings more now.', 4, '["premium", "trust"]', 1, 'testimonial', DATE_SUB(NOW(), INTERVAL 20 DAY)),
        
        -- Regular Testimonials (not featured)
        ('Alex Kim', 'alex.kim@example.com', 'Great app overall. The search functionality could be improved though.', 4, '["platform", "search"]', 0, 'testimonial', DATE_SUB(NOW(), INTERVAL 30 DAY)),
        ('Jordan Lee', NULL, 'Love the community vibe here. Everyone is so helpful and friendly.', 5, '["community"]', 0, 'testimonial', DATE_SUB(NOW(), INTERVAL 35 DAY)),
        ('Taylor Swift', NULL, 'AI recommendations are getting better every day. Impressed with the machine learning.', 4, '["ai", "improvement"]', 0, 'testimonial', DATE_SUB(NOW(), INTERVAL 40 DAY)),
        ('Morgan Davis', 'morgan.d@gmail.com', 'The mobile app is fantastic. Much better than the web version in my opinion.', 5, '["mobile", "ui"]', 0, 'testimonial', DATE_SUB(NOW(), INTERVAL 45 DAY)),
        ('Casey Wilson', NULL, 'Mix & Match is addictive! I spend hours browsing outfit combinations.', 4, '["mixmatch", "engagement"]', 0, 'testimonial', DATE_SUB(NOW(), INTERVAL 50 DAY)),
        ('Riley Brown', NULL, 'Customer service is top-notch. They resolved my issue within hours.', 5, '["support", "service"]', 0, 'testimonial', DATE_SUB(NOW(), INTERVAL 55 DAY)),
        ('Quinn Anderson', 'quinn.a@yahoo.com', 'The promotion features really work. My sales increased by 300%!', 5, '["promotion", "sales"]', 0, 'testimonial', DATE_SUB(NOW(), INTERVAL 60 DAY)),
        ('Blake Miller', NULL, 'Sustainable fashion made easy. Love supporting eco-friendly sellers.', 4, '["sustainability", "eco"]', 0, 'testimonial', DATE_SUB(NOW(), INTERVAL 65 DAY)),
        
        -- Regular Feedback
        (NULL, 'feedback@example.com', 'Please add a dark mode option. The bright interface hurts my eyes during late-night browsing.', NULL, NULL, 0, 'feedback', DATE_SUB(NOW(), INTERVAL 3 DAY)),
        (NULL, 'user123@gmail.com', 'The search filters are great, but could you add a size filter for shoes specifically?', NULL, NULL, 0, 'feedback', DATE_SUB(NOW(), INTERVAL 8 DAY)),
        (NULL, 'seller_pro@outlook.com', 'Would love to see analytics on which times of day get the most views for listings.', NULL, NULL, 0, 'feedback', DATE_SUB(NOW(), INTERVAL 12 DAY)),
        (NULL, NULL, 'Anonymous feedback: The app crashes sometimes when uploading multiple photos. Please fix.', NULL, NULL, 0, 'feedback', DATE_SUB(NOW(), INTERVAL 18 DAY)),
        (NULL, 'fashionista@hotmail.com', 'Can you add a wishlist feature? I want to save items I am interested in but not ready to buy.', NULL, NULL, 0, 'feedback', DATE_SUB(NOW(), INTERVAL 22 DAY)),
        (NULL, 'buyer_jane@example.com', 'The chat feature with sellers is excellent. Makes communication so much easier.', NULL, NULL, 0, 'feedback', DATE_SUB(NOW(), INTERVAL 28 DAY)),
        (NULL, NULL, 'Love the platform but the loading times could be faster. Especially on mobile.', NULL, NULL, 0, 'feedback', DATE_SUB(NOW(), INTERVAL 32 DAY)),
        (NULL, 'student_discount@edu.com', 'Any chance of student discounts for premium memberships?', NULL, NULL, 0, 'feedback', DATE_SUB(NOW(), INTERVAL 38 DAY)),
        (NULL, 'vintage_lover@gmail.com', 'More vintage clothing categories would be amazing. The current ones are too broad.', NULL, NULL, 0, 'feedback', DATE_SUB(NOW(), INTERVAL 42 DAY)),
        (NULL, NULL, 'The return policy information should be more prominent on listing pages.', NULL, NULL, 0, 'feedback', DATE_SUB(NOW(), INTERVAL 48 DAY)),
        (NULL, 'power_seller@yahoo.com', 'Bulk listing tools would save so much time. Please consider adding this feature.', NULL, NULL, 0, 'feedback', DATE_SUB(NOW(), INTERVAL 52 DAY)),
        (NULL, 'eco_warrior@greenmail.org', 'Love that you promote sustainable fashion! Maybe add carbon footprint info for shipping?', NULL, NULL, 0, 'feedback', DATE_SUB(NOW(), INTERVAL 58 DAY)),
        
        -- More diverse testimonials
        ('Sam Patel', NULL, 'As a small business owner, this platform has been a game-changer for my boutique.', 5, '["business", "entrepreneur"]', 0, 'testimonial', DATE_SUB(NOW(), INTERVAL 70 DAY)),
        ('Drew Chang', 'drew.c@fashion.com', 'The AI is scary good at predicting trends. My inventory decisions are much better now.', 5, '["ai", "trends", "business"]', 0, 'testimonial', DATE_SUB(NOW(), INTERVAL 75 DAY)),
        ('Avery Foster', NULL, 'College budget friendly! Found designer pieces at amazing prices.', 4, '["budget", "student", "designer"]', 0, 'testimonial', DATE_SUB(NOW(), INTERVAL 80 DAY)),
        ('River Hayes', NULL, 'The size-inclusive options are fantastic. Finally found clothes that fit perfectly!', 5, '["inclusive", "fit", "diversity"]', 0, 'testimonial', DATE_SUB(NOW(), INTERVAL 85 DAY)),
        ('Phoenix Taylor', 'phoenix.t@creative.com', 'Mix & Match helped me build my professional wardrobe from thrift finds. Genius!', 4, '["professional", "thrift", "mixmatch"]', 0, 'testimonial', DATE_SUB(NOW(), INTERVAL 90 DAY))
      `);
      console.log('Extensive testimonials and feedback inserted successfully');
    } catch (error) {
      console.log('Testimonials/Feedback error:', error.message);
    }
    
    // Insert sample users
    try {
      await connection.execute(`
        INSERT IGNORE INTO users (username, email, password_hash, role, status, is_premium, premium_until, created_at) VALUES 
        ('admin', 'admin@topcare.com', '$2b$10$hashedpassword1', 'Admin', 'active', 1, DATE_ADD(NOW(), INTERVAL 1 YEAR), DATE_SUB(NOW(), INTERVAL 365 DAY)),
        ('fashionista_emma', 'emma@example.com', '$2b$10$hashedpassword2', 'User', 'active', 1, DATE_ADD(NOW(), INTERVAL 6 MONTH), DATE_SUB(NOW(), INTERVAL 120 DAY)),
        ('vintage_hunter', 'vintage@gmail.com', '$2b$10$hashedpassword3', 'User', 'active', 0, NULL, DATE_SUB(NOW(), INTERVAL 90 DAY)),
        ('style_guru_alex', 'alex@fashion.co', '$2b$10$hashedpassword4', 'User', 'active', 1, DATE_ADD(NOW(), INTERVAL 3 MONTH), DATE_SUB(NOW(), INTERVAL 60 DAY)),
        ('casual_buyer', 'buyer@email.com', '$2b$10$hashedpassword5', 'User', 'active', 0, NULL, DATE_SUB(NOW(), INTERVAL 30 DAY)),
        ('premium_seller', 'seller@pro.com', '$2b$10$hashedpassword6', 'User', 'active', 1, DATE_ADD(NOW(), INTERVAL 9 MONTH), DATE_SUB(NOW(), INTERVAL 180 DAY)),
        ('trend_setter', 'trends@style.net', '$2b$10$hashedpassword7', 'User', 'active', 0, NULL, DATE_SUB(NOW(), INTERVAL 45 DAY)),
        ('eco_warrior', 'eco@green.org', '$2b$10$hashedpassword8', 'User', 'active', 1, DATE_ADD(NOW(), INTERVAL 1 YEAR), DATE_SUB(NOW(), INTERVAL 200 DAY)),
        ('budget_shopper', 'budget@student.edu', '$2b$10$hashedpassword9', 'User', 'active', 0, NULL, DATE_SUB(NOW(), INTERVAL 15 DAY)),
        ('luxury_lover', 'luxury@designer.com', '$2b$10$hashedpassword10', 'User', 'active', 1, DATE_ADD(NOW(), INTERVAL 2 YEAR), DATE_SUB(NOW(), INTERVAL 300 DAY))
      `);
      console.log('Sample users inserted successfully');
    } catch (error) {
      console.log('Users error:', error.message);
    }

    // Insert listing categories
    try {
      await connection.execute(`
        INSERT IGNORE INTO listing_categories (name, description, created_at) VALUES 
        ('Tops', 'T-shirts, blouses, sweaters, and all upper body clothing', DATE_SUB(NOW(), INTERVAL 300 DAY)),
        ('Bottoms', 'Jeans, pants, skirts, shorts, and all lower body clothing', DATE_SUB(NOW(), INTERVAL 300 DAY)),
        ('Dresses', 'Casual dresses, formal gowns, cocktail dresses', DATE_SUB(NOW(), INTERVAL 300 DAY)),
        ('Outerwear', 'Jackets, coats, blazers, and outdoor clothing', DATE_SUB(NOW(), INTERVAL 300 DAY)),
        ('Shoes', 'Sneakers, heels, boots, sandals, and all footwear', DATE_SUB(NOW(), INTERVAL 300 DAY)),
        ('Accessories', 'Bags, jewelry, belts, scarves, and fashion accessories', DATE_SUB(NOW(), INTERVAL 300 DAY)),
        ('Activewear', 'Sports clothing, gym wear, and athletic apparel', DATE_SUB(NOW(), INTERVAL 300 DAY)),
        ('Formal Wear', 'Business attire, evening wear, and special occasion clothing', DATE_SUB(NOW(), INTERVAL 300 DAY)),
        ('Vintage', 'Retro and vintage clothing from past decades', DATE_SUB(NOW(), INTERVAL 300 DAY)),
        ('Designer', 'High-end and luxury brand clothing and accessories', DATE_SUB(NOW(), INTERVAL 300 DAY))
      `);
      console.log('Listing categories inserted successfully');
    } catch (error) {
      console.log('Categories error:', error.message);
    }

    // Insert sample listings
    try {
      await connection.execute(`
        INSERT IGNORE INTO listings (name, description, category_id, seller_id, listed, price, image_url, brand, size, condition_type, tags, created_at) VALUES 
        ('Vintage Denim Jacket', 'Classic 80s denim jacket in excellent condition. Perfect for layering and adding a retro touch to any outfit.', 4, 3, 1, 45.00, 'https://example.com/images/denim-jacket.jpg', 'Levi\\'s', 'M', 'good', '["vintage", "denim", "jacket", "80s"]', DATE_SUB(NOW(), INTERVAL 5 DAY)),
        ('Designer Silk Blouse', 'Elegant silk blouse from luxury brand. Worn only twice, perfect for professional settings.', 1, 2, 1, 120.00, 'https://example.com/images/silk-blouse.jpg', 'Theory', 'S', 'like_new', '["designer", "silk", "professional", "luxury"]', DATE_SUB(NOW(), INTERVAL 3 DAY)),
        ('Nike Air Force 1 Sneakers', 'Classic white sneakers in great condition. Size 9, perfect for casual everyday wear.', 5, 4, 1, 65.00, 'https://example.com/images/air-force-1.jpg', 'Nike', '9', 'good', '["sneakers", "nike", "casual", "white"]', DATE_SUB(NOW(), INTERVAL 7 DAY)),
        ('Floral Summer Dress', 'Beautiful floral print dress, perfect for summer occasions. Light and airy fabric.', 3, 2, 1, 35.00, 'https://example.com/images/floral-dress.jpg', 'Zara', 'M', 'like_new', '["floral", "summer", "dress", "light"]', DATE_SUB(NOW(), INTERVAL 2 DAY)),
        ('Leather Crossbody Bag', 'Genuine leather crossbody bag in black. Compact but spacious, perfect for daily use.', 6, 6, 1, 80.00, 'https://example.com/images/leather-bag.jpg', 'Coach', 'One Size', 'good', '["leather", "bag", "crossbody", "black"]', DATE_SUB(NOW(), INTERVAL 10 DAY)),
        ('High-Waisted Jeans', 'Trendy high-waisted jeans in dark wash. Flattering fit and comfortable stretch.', 2, 4, 1, 40.00, 'https://example.com/images/high-waisted-jeans.jpg', 'American Eagle', '28', 'like_new', '["jeans", "high-waisted", "dark-wash", "stretch"]', DATE_SUB(NOW(), INTERVAL 1 DAY)),
        ('Yoga Leggings Set', 'Matching sports bra and leggings set. Moisture-wicking fabric, perfect for workouts.', 7, 8, 1, 55.00, 'https://example.com/images/yoga-set.jpg', 'Lululemon', 'S', 'good', '["yoga", "leggings", "sportswear", "set"]', DATE_SUB(NOW(), INTERVAL 8 DAY)),
        ('Cashmere Sweater', 'Luxury cashmere sweater in cream color. Super soft and warm, perfect for cooler weather.', 1, 10, 1, 150.00, 'https://example.com/images/cashmere-sweater.jpg', 'Brunello Cucinelli', 'M', 'like_new', '["cashmere", "luxury", "sweater", "cream"]', DATE_SUB(NOW(), INTERVAL 12 DAY)),
        ('Platform Heels', 'Statement platform heels in metallic gold. Perfect for special occasions and parties.', 5, 2, 1, 70.00, 'https://example.com/images/platform-heels.jpg', 'Steve Madden', '7', 'good', '["heels", "platform", "gold", "party"]', DATE_SUB(NOW(), INTERVAL 6 DAY)),
        ('Oversized Blazer', 'Trendy oversized blazer in navy blue. Great for both professional and casual styling.', 4, 6, 1, 85.00, 'https://example.com/images/oversized-blazer.jpg', 'H&M', 'L', 'like_new', '["blazer", "oversized", "navy", "versatile"]', DATE_SUB(NOW(), INTERVAL 4 DAY)),
        ('Retro Band T-Shirt', 'Authentic vintage band t-shirt from the 90s. Soft cotton, great for music lovers.', 1, 3, 1, 25.00, 'https://example.com/images/band-tshirt.jpg', 'Vintage', 'L', 'good', '["vintage", "band", "tshirt", "90s"]', DATE_SUB(NOW(), INTERVAL 9 DAY)),
        ('Designer Sunglasses', 'Classic aviator sunglasses with UV protection. Comes with original case.', 6, 10, 1, 200.00, 'https://example.com/images/aviator-sunglasses.jpg', 'Ray-Ban', 'One Size', 'like_new', '["sunglasses", "aviator", "designer", "uv-protection"]', DATE_SUB(NOW(), INTERVAL 11 DAY)),
        ('Midi Pencil Skirt', 'Professional midi pencil skirt in charcoal gray. Perfect for office wear.', 2, 4, 1, 30.00, 'https://example.com/images/pencil-skirt.jpg', 'Banana Republic', '6', 'good', '["skirt", "midi", "professional", "gray"]', DATE_SUB(NOW(), INTERVAL 13 DAY)),
        ('Winter Puffer Coat', 'Warm puffer coat for winter weather. Water-resistant and very cozy.', 4, 8, 1, 90.00, 'https://example.com/images/puffer-coat.jpg', 'The North Face', 'M', 'good', '["coat", "puffer", "winter", "warm"]', DATE_SUB(NOW(), INTERVAL 15 DAY)),
        ('Gold Statement Necklace', 'Bold gold statement necklace. Perfect for elevating simple outfits.', 6, 2, 1, 40.00, 'https://example.com/images/gold-necklace.jpg', 'BaubleBar', 'One Size', 'like_new', '["necklace", "gold", "statement", "jewelry"]', DATE_SUB(NOW(), INTERVAL 14 DAY))
      `);
      console.log('Sample listings inserted successfully');
    } catch (error) {
      console.log('Listings error:', error.message);
    }

    // Insert sample transactions
    try {
      await connection.execute(`
        INSERT IGNORE INTO transactions (buyer_id, seller_id, listing_id, quantity, price_each, status, created_at) VALUES 
        (5, 3, 1, 1, 45.00, 'completed', DATE_SUB(NOW(), INTERVAL 2 DAY)),
        (7, 2, 2, 1, 120.00, 'shipped', DATE_SUB(NOW(), INTERVAL 1 DAY)),
        (9, 4, 3, 1, 65.00, 'paid', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
        (5, 2, 4, 1, 35.00, 'completed', DATE_SUB(NOW(), INTERVAL 5 DAY)),
        (7, 6, 5, 1, 80.00, 'completed', DATE_SUB(NOW(), INTERVAL 7 DAY)),
        (9, 4, 6, 1, 40.00, 'pending', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
        (5, 8, 7, 1, 55.00, 'shipped', DATE_SUB(NOW(), INTERVAL 4 DAY)),
        (7, 10, 8, 1, 150.00, 'completed', DATE_SUB(NOW(), INTERVAL 10 DAY)),
        (9, 2, 9, 1, 70.00, 'completed', DATE_SUB(NOW(), INTERVAL 6 DAY)),
        (5, 6, 10, 1, 85.00, 'paid', DATE_SUB(NOW(), INTERVAL 2 HOUR))
      `);
      console.log('Sample transactions inserted successfully');
    } catch (error) {
      console.log('Transactions error:', error.message);
    }

    // Insert sample reviews
    try {
      await connection.execute(`
        INSERT IGNORE INTO reviews (listing_id, author, author_user_id, rating, comment, transaction_id, created_at) VALUES 
        (1, 'casual_buyer', 5, 5, 'Perfect jacket! Exactly as described and shipped quickly.', 1, DATE_SUB(NOW(), INTERVAL 1 DAY)),
        (4, 'casual_buyer', 5, 5, 'Love this dress! The fabric is so soft and the fit is perfect.', 4, DATE_SUB(NOW(), INTERVAL 4 DAY)),
        (5, 'trend_setter', 7, 4, 'Great bag, leather quality is good. Slightly smaller than expected but still happy.', 5, DATE_SUB(NOW(), INTERVAL 6 DAY)),
        (7, 'casual_buyer', 5, 5, 'Amazing yoga set! The fabric is so comfortable and breathable.', 7, DATE_SUB(NOW(), INTERVAL 3 DAY)),
        (8, 'trend_setter', 7, 5, 'This cashmere sweater is absolutely divine! Worth every penny.', 8, DATE_SUB(NOW(), INTERVAL 9 DAY)),
        (9, 'budget_shopper', 9, 4, 'Cute heels! A bit tight but I can make them work. Fast shipping.', 9, DATE_SUB(NOW(), INTERVAL 5 DAY)),
        (2, 'trend_setter', 7, 5, 'Beautiful blouse! Professional quality and the silk feels luxurious.', 2, DATE_SUB(NOW(), INTERVAL 12 HOUR)),
        (3, 'budget_shopper', 9, 5, 'Classic sneakers in great condition. Very comfortable!', 3, DATE_SUB(NOW(), INTERVAL 2 HOUR))
      `);
      console.log('Sample reviews inserted successfully');
    } catch (error) {
      console.log('Reviews error:', error.message);
    }

    // Insert sample FAQ entries
    try {
      await connection.execute(`
        INSERT IGNORE INTO faq (question, answer, created_at, answered_at) VALUES 
        ('How do I create a listing?', 'Click the "Sell" button in the navigation menu, then fill out the listing form with your item details, photos, and price.', DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 29 DAY)),
        ('What payment methods do you accept?', 'We accept all major credit cards, PayPal, and Apple Pay for secure transactions.', DATE_SUB(NOW(), INTERVAL 25 DAY), DATE_SUB(NOW(), INTERVAL 24 DAY)),
        ('How does the Mix & Match feature work?', 'Our AI analyzes your uploaded items and suggests outfit combinations based on style, color, and fashion trends.', DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 19 DAY)),
        ('What is the return policy?', 'Items can be returned within 7 days of delivery if they don\\'t match the description. Buyers pay return shipping unless the item was misrepresented.', DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY)),
        ('How do I become a premium member?', 'Click on your profile settings and select "Upgrade to Premium". Choose from monthly, quarterly, or annual plans.', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY)),
        ('Is shipping included in the price?', 'Shipping costs are calculated separately based on item size, weight, and delivery location. Sellers can choose to include shipping in their listing price.', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
        ('How do I contact a seller?', NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), NULL),
        ('Can I edit my listing after posting?', NULL, DATE_SUB(NOW(), INTERVAL 1 DAY), NULL)
      `);
      console.log('Sample FAQ entries inserted successfully');
    } catch (error) {
      console.log('FAQ error:', error.message);
    }

    // Insert sample reports
    try {
      await connection.execute(`
        INSERT IGNORE INTO reports (target_type, target_id, reporter, reason, status, notes, created_at, resolved_at) VALUES 
        ('listing', '3', 'concerned_buyer@email.com', 'Item condition was misrepresented. Photos showed perfect condition but item has visible wear.', 'resolved', 'Contacted seller, refund processed.', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY)),
        ('user', '4', 'safety_first@gmail.com', 'User is not responding to messages after payment was made.', 'open', 'Investigating communication issues.', DATE_SUB(NOW(), INTERVAL 5 DAY), NULL),
        ('listing', '7', 'authentic_check@style.com', 'Suspected counterfeit item. Brand logo looks off.', 'resolved', 'Item verified as authentic by brand expert.', DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY)),
        ('user', '6', 'unhappy_buyer@test.com', 'Seller cancelled order after payment without valid reason.', 'dismissed', 'Order was cancelled due to item damage during shipping preparation.', DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 18 DAY))
      `);
      console.log('Sample reports inserted successfully');
    } catch (error) {
      console.log('Reports error:', error.message);
    }

    // Insert site stats
    try {
      await connection.execute(`
        INSERT INTO site_stats (total_downloads, total_listings, total_sold, avg_rating) VALUES 
        (25847, 15674, 8932, 4.7)
        ON DUPLICATE KEY UPDATE 
          total_downloads=VALUES(total_downloads), 
          total_listings=VALUES(total_listings), 
          total_sold=VALUES(total_sold), 
          avg_rating=VALUES(avg_rating)
      `);
      console.log('Site stats inserted successfully');
    } catch (error) {
      console.log('Site stats error:', error.message);
    }
    
    // Insert pricing plans
    try {
      await connection.execute(`
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
          '["Unlimited listings", "Promotion: $2.00 / 3-day (30% off)", "First 3 listings: 3 days free promotion", "Commission: 5% per sale", "Mix & Match AI: Unlimited usage & saves", "Seller badge: Premium badge on profile & listings"]',
          1
        )
      `);
      console.log('Pricing plans inserted successfully');
    } catch (error) {
      console.log('Pricing plans error:', error.message);
    }
    
    // Ensure landing_content exists
    try {
      await connection.execute(`
        INSERT IGNORE INTO landing_content (id, hero_title, hero_subtitle) VALUES 
        (1, 'Discover outfits powered by AI', 'Mix & Match is an AI outfit recommender that builds looks from listed items. Snap, list, and get smart suggestions instantly.')
      `);
      console.log('Landing content inserted successfully');
    } catch (error) {
      console.log('Landing content error:', error.message);
    }
    
    await connection.end();
    
    console.log('✅ Database initialization completed successfully!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run initialization
initializeDatabase();
