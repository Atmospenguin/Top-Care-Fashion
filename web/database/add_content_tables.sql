-- Add new tables for dynamic content management

CREATE TABLE IF NOT EXISTS testimonials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_name VARCHAR(100) NOT NULL,
  text TEXT NOT NULL,
  rating TINYINT NOT NULL DEFAULT 5,
  tags TEXT NULL,
  featured TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_stats (
  id TINYINT PRIMARY KEY DEFAULT 1,
  total_downloads INT NOT NULL DEFAULT 0,
  total_listings INT NOT NULL DEFAULT 0,
  total_sold INT NOT NULL DEFAULT 0,
  avg_rating DECIMAL(2,1) NOT NULL DEFAULT 4.8,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pricing_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_type ENUM('free','premium') NOT NULL,
  name VARCHAR(50) NOT NULL,
  description VARCHAR(100) NULL,
  price_monthly DECIMAL(6,2) NOT NULL DEFAULT 0,
  price_quarterly DECIMAL(6,2) NULL,
  price_annual DECIMAL(6,2) NULL,
  listing_limit INT NULL,
  promotion_price DECIMAL(6,2) NOT NULL,
  promotion_discount DECIMAL(5,2) NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  mixmatch_limit INT NULL,
  free_promotion_credits INT NOT NULL DEFAULT 0,
  seller_badge VARCHAR(100) NULL,
  features TEXT NULL,
  is_popular TINYINT(1) NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS landing_content (
  id TINYINT PRIMARY KEY DEFAULT 1,
  hero_title VARCHAR(255) NOT NULL DEFAULT 'Discover outfits powered by AI',
  hero_subtitle TEXT NOT NULL DEFAULT 'Mix & Match is an AI outfit recommender that builds looks from listed items.',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
