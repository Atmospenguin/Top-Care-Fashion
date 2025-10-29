-- Top Care Fashion seed for Postgres/Supabase
-- Run in Supabase SQL Editor
begin;

-- 1) 清空（注意顺序，先子表后父表；CASCADE 保底）
truncate reviews restart identity cascade;

truncate transactions restart identity cascade;

truncate listings restart identity cascade;

truncate listing_categories restart identity cascade;

truncate feedback restart identity cascade;

truncate faq restart identity cascade;

truncate reports restart identity cascade;

truncate site_stats restart identity cascade;

truncate pricing_plans restart identity cascade;

truncate users restart identity cascade;

truncate landing_content restart identity cascade;

-- 2) users（显式 id，确保后续 seller_id/buyer_id 对得上）
insert into
  users (
    id,
    username,
    email,
    password_hash,
    role,
    status,
    is_premium,
    premium_until,
    created_at
  )
values
  (
    1,
    'admin',
    'admin@topcare.com',
    '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
    'ADMIN',
    'ACTIVE',
    true,
    now() + interval '1 year',
    now() - interval '365 days'
  ),
  (
    2,
    'fashionista_emma',
    'emma@example.com',
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
    'USER',
    'ACTIVE',
    true,
    now() + interval '6 months',
    now() - interval '120 days'
  ),
  (
    3,
    'vintage_hunter',
    'vintage@gmail.com',
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
    'USER',
    'ACTIVE',
    false,
    null,
    now() - interval '90 days'
  ),
  (
    4,
    'style_guru_alex',
    'alex@fashion.co',
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
    'USER',
    'ACTIVE',
    true,
    now() + interval '3 months',
    now() - interval '60 days'
  ),
  (
    5,
    'casual_buyer',
    'buyer@email.com',
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
    'USER',
    'ACTIVE',
    false,
    null,
    now() - interval '30 days'
  ),
  (
    6,
    'premium_seller',
    'seller@pro.com',
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
    'USER',
    'ACTIVE',
    true,
    now() + interval '9 months',
    now() - interval '180 days'
  ),
  (
    7,
    'trend_setter',
    'trends@style.net',
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
    'USER',
    'ACTIVE',
    false,
    null,
    now() - interval '45 days'
  ),
  (
    8,
    'eco_warrior',
    'eco@green.org',
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
    'USER',
    'ACTIVE',
    true,
    now() + interval '1 year',
    now() - interval '200 days'
  ),
  (
    9,
    'budget_shopper',
    'budget@student.edu',
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
    'USER',
    'ACTIVE',
    false,
    null,
    now() - interval '15 days'
  ),
  (
    10,
    'luxury_lover',
    'luxury@designer.com',
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
    'USER',
    'ACTIVE',
    true,
    now() + interval '2 years',
    now() - interval '300 days'
  );

select
  setval(
    'users_id_seq',
    (
      select
        max(id)
      from
        users
    )
  );

-- 3) listing_categories（显式 id 1..10）
insert into
  listing_categories (id, name, description, created_at)
values
  (
    1,
    'Tops',
    'T-shirts, blouses, sweaters, and all upper body clothing',
    now() - interval '300 days'
  ),
  (
    2,
    'Bottoms',
    'Jeans, pants, skirts, shorts, and all lower body clothing',
    now() - interval '300 days'
  ),
  (
    3,
    'Dresses',
    'Casual dresses, formal gowns, cocktail dresses',
    now() - interval '300 days'
  ),
  (
    4,
    'Outerwear',
    'Jackets, coats, blazers, and outdoor clothing',
    now() - interval '300 days'
  ),
  (
    5,
    'Shoes',
    'Sneakers, heels, boots, sandals, and all footwear',
    now() - interval '300 days'
  ),
  (
    6,
    'Accessories',
    'Bags, jewelry, belts, scarves, and fashion accessories',
    now() - interval '300 days'
  ),
  (
    7,
    'Activewear',
    'Sports clothing, gym wear, and athletic apparel',
    now() - interval '300 days'
  ),
  (
    8,
    'Formal Wear',
    'Business attire, evening wear, and special occasion clothing',
    now() - interval '300 days'
  ),
  (
    9,
    'Vintage',
    'Retro and vintage clothing from past decades',
    now() - interval '300 days'
  ),
  (
    10,
    'Designer',
    'High-end and luxury brand clothing and accessories',
    now() - interval '300 days'
  );

select
  setval(
    'listing_categories_id_seq',
    (
      select
        max(id)
      from
        listing_categories
    )
  );

-- 4) listings（显式 id 1..15；ENUM 按大写）
insert into
  listings (
    id,
    name,
    description,
    category_id,
    seller_id,
    listed,
    sold,
    price,
    image_url,
    brand,
    size,
    condition_type,
    tags,
    created_at,
    sold_at
  )
values
  (
    1,
    'Vintage Denim Jacket',
    'Classic 80s denim jacket in excellent condition. Perfect for layering and adding a retro touch to any outfit.',
    4,
    3,
    true,
    true,
    45.00,
    'https://example.com/images/denim-jacket.jpg',
    'Levi''s',
    'M',
    'GOOD',
    '["vintage","denim","jacket","80s"]',
    now() - interval '5 days',
    now() - interval '2 days'
  ),
  (
    2,
    'Designer Silk Blouse',
    'Elegant silk blouse from luxury brand. Worn only twice, perfect for professional settings.',
    1,
    2,
    true,
    false,
    120.00,
    'https://example.com/images/silk-blouse.jpg',
    'Theory',
    'S',
    'LIKE_NEW',
    '["designer","silk","professional","luxury"]',
    now() - interval '3 days',
    null
  ),
  (
    3,
    'Nike Air Force 1 Sneakers',
    'Classic white sneakers in great condition. Size 9, perfect for casual everyday wear.',
    5,
    4,
    true,
    false,
    65.00,
    'https://example.com/images/air-force-1.jpg',
    'Nike',
    '9',
    'GOOD',
    '["sneakers","nike","casual","white"]',
    now() - interval '7 days',
    null
  ),
  (
    4,
    'Floral Summer Dress',
    'Beautiful floral print dress, perfect for summer occasions. Light and airy fabric.',
    3,
    2,
    true,
    true,
    35.00,
    'https://example.com/images/floral-dress.jpg',
    'Zara',
    'M',
    'LIKE_NEW',
    '["floral","summer","dress","light"]',
    now() - interval '2 days',
    now() - interval '5 days'
  ),
  (
    5,
    'Leather Crossbody Bag',
    'Genuine leather crossbody bag in black. Compact but spacious, perfect for daily use.',
    6,
    6,
    true,
    true,
    80.00,
    'https://example.com/images/leather-bag.jpg',
    'Coach',
    'One Size',
    'GOOD',
    '["leather","bag","crossbody","black"]',
    now() - interval '10 days',
    now() - interval '7 days'
  ),
  (
    6,
    'High-Waisted Jeans',
    'Trendy high-waisted jeans in dark wash. Flattering fit and comfortable stretch.',
    2,
    4,
    true,
    false,
    40.00,
    'https://example.com/images/high-waisted-jeans.jpg',
    'American Eagle',
    '28',
    'LIKE_NEW',
    '["jeans","high-waisted","dark-wash","stretch"]',
    now() - interval '1 day',
    null
  ),
  (
    7,
    'Yoga Leggings Set',
    'Matching sports bra and leggings set. Moisture-wicking fabric, perfect for workouts.',
    7,
    8,
    true,
    false,
    55.00,
    'https://example.com/images/yoga-set.jpg',
    'Lululemon',
    'S',
    'GOOD',
    '["yoga","leggings","sportswear","set"]',
    now() - interval '8 days',
    null
  ),
  (
    8,
    'Cashmere Sweater',
    'Luxury cashmere sweater in cream color. Super soft and warm, perfect for cooler weather.',
    1,
    10,
    true,
    true,
    150.00,
    'https://example.com/images/cashmere-sweater.jpg',
    'Brunello Cucinelli',
    'M',
    'LIKE_NEW',
    '["cashmere","luxury","sweater","cream"]',
    now() - interval '12 days',
    now() - interval '10 days'
  ),
  (
    9,
    'Platform Heels',
    'Statement platform heels in metallic gold. Perfect for special occasions and parties.',
    5,
    2,
    true,
    true,
    70.00,
    'https://example.com/images/platform-heels.jpg',
    'Steve Madden',
    '7',
    'GOOD',
    '["heels","platform","gold","party"]',
    now() - interval '6 days',
    now() - interval '6 days'
  ),
  (
    10,
    'Oversized Blazer',
    'Trendy oversized blazer in navy blue. Great for both professional and casual styling.',
    4,
    6,
    true,
    false,
    85.00,
    'https://example.com/images/oversized-blazer.jpg',
    'H&M',
    'L',
    'LIKE_NEW',
    '["blazer","oversized","navy","versatile"]',
    now() - interval '4 days',
    null
  ),
  (
    11,
    'Retro Band T-Shirt',
    'Authentic vintage band t-shirt from the 90s. Soft cotton, great for music lovers.',
    1,
    3,
    true,
    false,
    25.00,
    'https://example.com/images/band-tshirt.jpg',
    'Vintage',
    'L',
    'GOOD',
    '["vintage","band","tshirt","90s"]',
    now() - interval '9 days',
    null
  ),
  (
    12,
    'Designer Sunglasses',
    'Classic aviator sunglasses with UV protection. Comes with original case.',
    6,
    10,
    true,
    false,
    200.00,
    'https://example.com/images/aviator-sunglasses.jpg',
    'Ray-Ban',
    'One Size',
    'LIKE_NEW',
    '["sunglasses","aviator","designer","uv-protection"]',
    now() - interval '11 days',
    null
  ),
  (
    13,
    'Midi Pencil Skirt',
    'Professional midi pencil skirt in charcoal gray. Perfect for office wear.',
    2,
    4,
    true,
    false,
    30.00,
    'https://example.com/images/pencil-skirt.jpg',
    'Banana Republic',
    '6',
    'GOOD',
    '["skirt","midi","professional","gray"]',
    now() - interval '13 days',
    null
  ),
  (
    14,
    'Winter Puffer Coat',
    'Warm puffer coat for winter weather. Water-resistant and very cozy.',
    4,
    8,
    true,
    false,
    90.00,
    'https://example.com/images/puffer-coat.jpg',
    'The North Face',
    'M',
    'GOOD',
    '["coat","puffer","winter","warm"]',
    now() - interval '15 days',
    null
  ),
  (
    15,
    'Gold Statement Necklace',
    'Bold gold statement necklace. Perfect for elevating simple outfits.',
    6,
    2,
    true,
    false,
    40.00,
    'https://example.com/images/gold-necklace.jpg',
    'BaubleBar',
    'One Size',
    'LIKE_NEW',
    '["necklace","gold","statement","jewelry"]',
    now() - interval '14 days',
    null
  );

select
  setval(
    'listings_id_seq',
    (
      select
        max(id)
      from
        listings
    )
  );

-- 5) transactions（显式 id 引用上面 listing & users）
insert into
  transactions (
    id,
    buyer_id,
    seller_id,
    listing_id,
    quantity,
    price_each,
    status,
    created_at
  )
values
  (
    1,
    5,
    3,
    1,
    1,
    45.00,
    'COMPLETED',
    now() - interval '2 days'
  ),
  (
    2,
    7,
    2,
    2,
    1,
    120.00,
    'SHIPPED',
    now() - interval '1 days'
  ),
  (
    3,
    9,
    4,
    3,
    1,
    65.00,
    'PAID',
    now() - interval '3 hours'
  ),
  (
    4,
    5,
    2,
    4,
    1,
    35.00,
    'COMPLETED',
    now() - interval '5 days'
  ),
  (
    5,
    7,
    6,
    5,
    1,
    80.00,
    'COMPLETED',
    now() - interval '7 days'
  ),
  (
    6,
    9,
    4,
    6,
    1,
    40.00,
    'PENDING',
    now() - interval '1 hours'
  ),
  (
    7,
    5,
    8,
    7,
    1,
    55.00,
    'SHIPPED',
    now() - interval '4 days'
  ),
  (
    8,
    7,
    10,
    8,
    1,
    150.00,
    'COMPLETED',
    now() - interval '10 days'
  ),
  (
    9,
    9,
    2,
    9,
    1,
    70.00,
    'COMPLETED',
    now() - interval '6 days'
  ),
  (
    10,
    5,
    6,
    10,
    1,
    85.00,
    'PAID',
    now() - interval '2 hours'
  );

select
  setval(
    'transactions_id_seq',
    (
      select
        max(id)
      from
        transactions
    )
  );

-- 6) reviews（显式 id）
insert into
  reviews (
    id,
    transaction_id,
    reviewer_id,
    reviewee_id,
    rating,
    comment,
    reviewer_type,
    created_at
  )
values
  (
    1,
    1,
    5,
    3,
    5,
    'Perfect jacket! Exactly as described and shipped quickly. Great communication from seller.',
    'BUYER',
    now() - interval '1 days'
  ),
  (
    2,
    1,
    3,
    5,
    5,
    'Excellent buyer! Quick payment and great communication. Highly recommended.',
    'SELLER',
    now() - interval '1 days'
  ),
  (
    3,
    4,
    5,
    2,
    5,
    'Love this dress! The fabric is so soft and the fit is perfect. Emma is a fantastic seller.',
    'BUYER',
    now() - interval '4 days'
  ),
  (
    4,
    4,
    2,
    5,
    5,
    'Amazing buyer! Very understanding and pleasant to work with. Thank you!',
    'SELLER',
    now() - interval '4 days'
  ),
  (
    5,
    5,
    7,
    6,
    4,
    'Great bag, leather quality is good. Slightly smaller than expected but still happy with purchase.',
    'BUYER',
    now() - interval '6 days'
  ),
  (
    6,
    5,
    6,
    7,
    5,
    'Perfect transaction! Fast payment and great buyer communication.',
    'SELLER',
    now() - interval '6 days'
  ),
  (
    7,
    7,
    5,
    8,
    5,
    'Amazing yoga set! The fabric is so comfortable and breathable. Perfect for my workouts.',
    'BUYER',
    now() - interval '3 days'
  ),
  (
    8,
    8,
    7,
    10,
    5,
    'This cashmere sweater is absolutely divine! Worth every penny. Luxury quality as promised.',
    'BUYER',
    now() - interval '9 days'
  ),
  (
    9,
    8,
    10,
    7,
    5,
    'Wonderful buyer! Appreciated the quality and paid promptly. Would sell to again.',
    'SELLER',
    now() - interval '9 days'
  ),
  (
    10,
    9,
    9,
    2,
    4,
    'Cute heels! A bit tight but I can make them work. Fast shipping and well packaged.',
    'BUYER',
    now() - interval '5 days'
  ),
  (
    11,
    9,
    2,
    9,
    4,
    'Good buyer, but had some sizing concerns. Communication could have been better.',
    'SELLER',
    now() - interval '5 days'
  ),
  (
    12,
    2,
    7,
    2,
    5,
    'Beautiful blouse! Professional quality and the silk feels luxurious. Perfect for work.',
    'BUYER',
    now() - interval '12 hours'
  );

select
  setval(
    'reviews_id_seq',
    (
      select
        max(id)
      from
        reviews
    )
  );

-- 7) feedback（全量）
insert into
  feedback (
    user_name,
    user_email,
    message,
    rating,
    tags,
    featured,
    created_at
  )
values
  (
    'Ava Chen',
    null,
    'Mix & Match nailed my vibe in minutes. The AI suggestions are surprisingly accurate!',
    5,
    '["mixmatch","ai","buyer"]',
    true,
    now() - interval '2 days'
  ),
  (
    'Leo Martinez',
    null,
    'AI Listing wrote better titles than I do. Saved me hours of work every week.',
    5,
    '["ailisting","productivity"]',
    true,
    now() - interval '5 days'
  ),
  (
    'Mia Johnson',
    null,
    'Premium perks are worth it for frequent sellers. The commission reduction pays for itself.',
    5,
    '["premium","savings"]',
    true,
    now() - interval '7 days'
  ),
  (
    'Kai Nakamura',
    null,
    'Found full outfits with Mix & Match. Love how it combines pieces I never thought would work together.',
    4,
    '["mixmatch","outfits"]',
    true,
    now() - interval '19 days'
  ),
  (
    'Zoe Williams',
    null,
    'AI Listing saved me tons of time. The descriptions are professional and engaging.',
    5,
    '["ailisting","time-saving"]',
    true,
    now() - interval '25 days'
  ),
  (
    'Emma Rodriguez',
    null,
    'The platform is so user-friendly. Sold my first item within 24 hours!',
    5,
    '["platform","easy-use"]',
    true,
    now() - interval '10 days'
  ),
  (
    'Ryan Thompson',
    null,
    'Mix & Match helped me discover my personal style. The combinations are always on point.',
    5,
    '["mixmatch","style","seller"]',
    true,
    now() - interval '15 days'
  ),
  (
    'Sofia Garcia',
    null,
    'Premium badge really makes a difference. Buyers trust my listings more now.',
    4,
    '["premium","trust"]',
    true,
    now() - interval '20 days'
  ),
  (
    'Alex Kim',
    'alex.kim@example.com',
    'Great app overall. The search functionality could be improved though.',
    4,
    '["platform","search","buyer"]',
    false,
    now() - interval '30 days'
  ),
  (
    'Jordan Lee',
    null,
    'Love the community vibe here. Everyone is so helpful and friendly.',
    5,
    '["community"]',
    false,
    now() - interval '35 days'
  ),
  (
    'Taylor Swift',
    null,
    'AI recommendations are getting better every day. Impressed with the machine learning.',
    4,
    '["ai","improvement"]',
    false,
    now() - interval '40 days'
  ),
  (
    'Morgan Davis',
    'morgan.d@gmail.com',
    'The mobile app is fantastic. Much better than the web version in my opinion.',
    5,
    '["mobile","ui","seller"]',
    false,
    now() - interval '45 days'
  ),
  (
    'Casey Wilson',
    null,
    'Mix & Match is addictive! I spend hours browsing outfit combinations.',
    4,
    '["mixmatch","engagement"]',
    false,
    now() - interval '50 days'
  ),
  (
    'Riley Brown',
    null,
    'Customer service is top-notch. They resolved my issue within hours.',
    5,
    '["support","service"]',
    false,
    now() - interval '55 days'
  ),
  (
    'Quinn Anderson',
    'quinn.a@yahoo.com',
    'The promotion features really work. My sales increased by 300%!',
    5,
    '["promotion","sales"]',
    false,
    now() - interval '60 days'
  ),
  (
    'Blake Miller',
    null,
    'Sustainable fashion made easy. Love supporting eco-friendly sellers.',
    4,
    '["sustainability","eco"]',
    false,
    now() - interval '65 days'
  ),
  (
    null,
    'feedback@example.com',
    'Please add a dark mode option. The bright interface hurts my eyes during late-night browsing.',
    null,
    null,
    false,
    now() - interval '3 days'
  ),
  (
    null,
    'user123@gmail.com',
    'The search filters are great, but could you add a size filter for shoes specifically?',
    null,
    null,
    false,
    now() - interval '8 days'
  ),
  (
    null,
    'seller_pro@outlook.com',
    'Would love to see analytics on which times of day get the most views for listings.',
    null,
    null,
    false,
    now() - interval '12 days'
  ),
  (
    null,
    null,
    'Anonymous feedback: The app crashes sometimes when uploading multiple photos. Please fix.',
    null,
    null,
    false,
    now() - interval '18 days'
  ),
  (
    null,
    'fashionista@hotmail.com',
    'Can you add a wishlist feature? I want to save items I am interested in but not ready to buy.',
    null,
    null,
    false,
    now() - interval '22 days'
  ),
  (
    null,
    'buyer_jane@example.com',
    'The chat feature with sellers is excellent. Makes communication so much easier.',
    null,
    '["buyer"]',
    false,
    now() - interval '28 days'
  ),
  (
    null,
    null,
    'Love the platform but the loading times could be faster. Especially on mobile.',
    null,
    null,
    false,
    now() - interval '32 days'
  ),
  (
    null,
    'student_discount@edu.com',
    'Any chance of student discounts for premium memberships?',
    null,
    null,
    false,
    now() - interval '38 days'
  ),
  (
    null,
    'vintage_lover@gmail.com',
    'More vintage clothing categories would be amazing. The current ones are too broad.',
    null,
    null,
    false,
    now() - interval '42 days'
  ),
  (
    null,
    null,
    'The return policy information should be more prominent on listing pages.',
    null,
    null,
    false,
    now() - interval '48 days'
  ),
  (
    null,
    'power_seller@yahoo.com',
    'Bulk listing tools would save so much time. Please consider adding this feature.',
    null,
    null,
    false,
    now() - interval '52 days'
  ),
  (
    null,
    'eco_warrior@greenmail.org',
    'Love that you promote sustainable fashion! Maybe add carbon footprint info for shipping?',
    null,
    null,
    false,
    now() - interval '58 days'
  ),
  (
    'Sam Patel',
    null,
    'As a small business owner, this platform has been a game-changer for my boutique.',
    5,
    '["business","entrepreneur"]',
    false,
    now() - interval '70 days'
  ),
  (
    'Drew Chang',
    'drew.c@fashion.com',
    'The AI is scary good at predicting trends. My inventory decisions are much better now.',
    5,
    '["ai","trends","business"]',
    false,
    now() - interval '75 days'
  ),
  (
    'Avery Foster',
    null,
    'College budget friendly! Found designer pieces at amazing prices.',
    4,
    '["budget","student","designer"]',
    false,
    now() - interval '80 days'
  ),
  (
    'River Hayes',
    null,
    'The size-inclusive options are fantastic. Finally found clothes that fit perfectly!',
    5,
    '["inclusive","fit","diversity"]',
    false,
    now() - interval '85 days'
  ),
  (
    'Phoenix Taylor',
    'phoenix.t@creative.com',
    'Mix & Match helped me build my professional wardrobe from thrift finds. Genius!',
    4,
    '["professional","thrift","mixmatch"]',
    false,
    now() - interval '90 days'
  );

-- 8) FAQ
insert into
  faq (id, question, answer, created_at, answered_at)
values
  (
    1,
    'How do I create a listing?',
    'Click the "Sell" button in the navigation menu, then fill out the listing form with your item details, photos, and price.',
    now() - interval '30 days',
    now() - interval '29 days'
  ),
  (
    2,
    'What payment methods do you accept?',
    'We accept all major credit cards, PayPal, and Apple Pay for secure transactions.',
    now() - interval '25 days',
    now() - interval '24 days'
  ),
  (
    3,
    'How does the Mix & Match feature work?',
    'Our AI analyzes your uploaded items and suggests outfit combinations based on style, color, and fashion trends.',
    now() - interval '20 days',
    now() - interval '19 days'
  ),
  (
    4,
    'What is the return policy?',
    'Items can be returned within 7 days of delivery if they don''t match the description. Buyers pay return shipping unless the item was misrepresented.',
    now() - interval '15 days',
    now() - interval '14 days'
  ),
  (
    5,
    'How do I become a premium member?',
    'Click on your profile settings and select "Upgrade to Premium". Choose from monthly, quarterly, or annual plans.',
    now() - interval '10 days',
    now() - interval '9 days'
  ),
  (
    6,
    'Is shipping included in the price?',
    'Shipping costs are calculated separately based on item size, weight, and delivery location. Sellers can choose to include shipping in their listing price.',
    now() - interval '5 days',
    now() - interval '4 days'
  ),
  (
    7,
    'How do I contact a seller?',
    null,
    now() - interval '2 days',
    null
  ),
  (
    8,
    'Can I edit my listing after posting?',
    null,
    now() - interval '1 days',
    null
  );

select
  setval(
    'faq_id_seq',
    (
      select
        max(id)
      from
        faq
    )
  );

-- 9) reports
insert into
  reports (
    id,
    target_type,
    target_id,
    reporter,
    reason,
    status,
    notes,
    created_at,
    resolved_at
  )
values
  (
    1,
    'LISTING',
    '3',
    'concerned_buyer@email.com',
    'Item condition was misrepresented. Photos showed perfect condition but item has visible wear.',
    'RESOLVED',
    'Contacted seller, refund processed.',
    now() - interval '10 days',
    now() - interval '8 days'
  ),
  (
    2,
    'USER',
    '4',
    'safety_first@gmail.com',
    'User is not responding to messages after payment was made.',
    'OPEN',
    'Investigating communication issues.',
    now() - interval '5 days',
    null
  ),
  (
    3,
    'LISTING',
    '7',
    'authentic_check@style.com',
    'Suspected counterfeit item. Brand logo looks off.',
    'RESOLVED',
    'Item verified as authentic by brand expert.',
    now() - interval '15 days',
    now() - interval '12 days'
  ),
  (
    4,
    'USER',
    '6',
    'unhappy_buyer@test.com',
    'Seller cancelled order after payment without valid reason.',
    'DISMISSED',
    'Order was cancelled due to item damage during shipping preparation.',
    now() - interval '20 days',
    now() - interval '18 days'
  );

select
  setval(
    'reports_id_seq',
    (
      select
        max(id)
      from
        reports
    )
  );

-- 10) site_stats（id=1 upsert）
insert into
  site_stats (
    id,
    total_users,
    total_listings,
    total_sold,
    avg_rating
  )
values
  (1, 12500, 15674, 8932, 4.7)
on conflict (id) do update
set
  total_users = excluded.total_users,
  total_listings = excluded.total_listings,
  total_sold = excluded.total_sold,
  avg_rating = excluded.avg_rating;

-- 11) pricing_plans
insert into
  pricing_plans (
    id,
    plan_type,
    name,
    description,
    price_monthly,
    price_quarterly,
    price_annual,
    listing_limit,
    promotion_price,
    promotion_discount,
    commission_rate,
    mixmatch_limit,
    free_promotion_credits,
    seller_badge,
    features,
    is_popular,
    active,
    created_at
  )
values
  (
    1,
    'FREE',
    'Free',
    '$0 / month',
    0,
    null,
    null,
    2,
    2.90,
    null,
    10.00,
    3,
    0,
    null,
    '["Up to 2 active listings","Promotion: $2.90 / 3-day","Free promo credits: None","Commission: 10% per sale","Mix & Match AI: 3 total uses","Seller badge: None","Payment options: Free"]',
    false,
    true,
    now()
  ),
  (
    2,
    'PREMIUM',
    'Premium',
    'Monthly / Quarterly / Annual',
    6.90,
    18.90,
    59.90,
    null,
    2.00,
    30.00,
    5.00,
    null,
    3,
    'Premium Badge',
    '["Unlimited listings","Promotion: $2.00 / 3-day (30% off)","First 3 listings: 3 days free promotion","Commission: 5% per sale","Mix & Match AI: Unlimited usage & saves","Seller badge: Premium badge on profile & listings"]',
    true,
    true,
    now()
  );

select
  setval(
    'pricing_plans_id_seq',
    (
      select
        max(id)
      from
        pricing_plans
    )
  );

-- 12) landing_content
insert into
  landing_content (id, hero_title, hero_subtitle, feature_cards, updated_at)
values
  (
    1,
    'Discover outfits powered by AI',
    'Mix & Match is an AI outfit recommender that builds looks from listed items. Snap, list, and get smart suggestions instantly.',
    '[
      {"title":"Mix & Match","desc":"AI outfit recommendations from your listed items.","images":[]},
      {"title":"AI Listing","desc":"Auto-generate titles, tags and descriptions from photos.","images":[]},
      {"title":"Search","desc":"Natural language and image-based search to find pieces fast.","images":[]}
    ]'::jsonb,
    now()
  )
on conflict (id) do nothing;

commit;
