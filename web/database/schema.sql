-- Combined schema for Top Care Fashion (merged from schema.sql and add_content_tables.sql)
-- Use this file to create the full database schema in a single import.

-- Top Care Fashion schema (MySQL)
CREATE DATABASE IF NOT EXISTS `top_care_fashion` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;
USE `top_care_fashion`;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  email VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(191) NULL,
  role ENUM('User','Admin') NOT NULL DEFAULT 'User',
  status ENUM('active','suspended') NOT NULL DEFAULT 'active',
  is_premium TINYINT(1) NOT NULL DEFAULT 0,
  premium_until TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS listing_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS listings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description TEXT NULL,
  category_id INT NULL,
  seller_id INT NULL,
  listed TINYINT(1) NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url VARCHAR(500) NULL,
  image_urls TEXT NULL COMMENT 'JSON array of image URLs',
  brand VARCHAR(100) NULL,
  size VARCHAR(50) NULL,
  condition_type ENUM('new','like_new','good','fair','poor') DEFAULT 'good',
  tags TEXT NULL COMMENT 'JSON array of tags',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_listings_category FOREIGN KEY (category_id) REFERENCES listing_categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_listings_seller FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Transactions connecting buyers and sellers (both are Users)
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  buyer_id INT NOT NULL,
  seller_id INT NOT NULL,
  listing_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price_each DECIMAL(10,2) NOT NULL,
  status ENUM('pending','paid','shipped','completed','cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tx_buyer FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_tx_seller FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_tx_listing FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  author VARCHAR(100) NOT NULL,
  author_user_id INT NULL,
  rating TINYINT NOT NULL,
  comment TEXT NOT NULL,
  transaction_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_listing FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_author FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_reviews_tx FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
);

-- Unified feedback system (includes both user feedback and testimonials)
CREATE TABLE IF NOT EXISTS feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_email VARCHAR(191) NULL,
  user_name VARCHAR(100) NULL COMMENT 'Display name for testimonials',
  message TEXT NOT NULL,
  rating TINYINT NULL DEFAULT NULL COMMENT 'Rating 1-5 for testimonials',
  tags JSON NULL COMMENT 'Array of tags for testimonials like ["mixmatch", "ailisting", "premium"]',
  featured TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Featured on homepage as testimonial',
  feedback_type ENUM('feedback', 'testimonial') NOT NULL DEFAULT 'feedback',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS faq (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  answered_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS landing_content (
  id TINYINT PRIMARY KEY DEFAULT 1,
  hero_title VARCHAR(200) NOT NULL,
  hero_subtitle VARCHAR(300) NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Site statistics for homepage display
CREATE TABLE IF NOT EXISTS site_stats (
  id TINYINT PRIMARY KEY DEFAULT 1,
  total_downloads INT NOT NULL DEFAULT 0,
  total_listings INT NOT NULL DEFAULT 0,
  total_sold INT NOT NULL DEFAULT 0,
  avg_rating DECIMAL(2,1) NOT NULL DEFAULT 4.8,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Pricing plans configuration
CREATE TABLE IF NOT EXISTS pricing_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_type ENUM('free','premium') NOT NULL,
  name VARCHAR(50) NOT NULL,
  description VARCHAR(100) NULL,
  price_monthly DECIMAL(6,2) NOT NULL DEFAULT 0,
  price_quarterly DECIMAL(6,2) NULL,
  price_annual DECIMAL(6,2) NULL,
  listing_limit INT NULL COMMENT 'NULL means unlimited',
  promotion_price DECIMAL(6,2) NOT NULL,
  promotion_discount DECIMAL(5,2) NULL COMMENT 'Discount percentage for premium users',
  commission_rate DECIMAL(5,2) NOT NULL,
  mixmatch_limit INT NULL COMMENT 'NULL means unlimited',
  free_promotion_credits INT NOT NULL DEFAULT 0,
  seller_badge VARCHAR(100) NULL,
  features JSON NULL COMMENT 'Array of plan features',
  is_popular TINYINT(1) NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User reports (not sales reports)
CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  target_type ENUM('listing','user') NOT NULL,
  target_id VARCHAR(64) NOT NULL,
  reporter VARCHAR(191) NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('open','resolved','dismissed') NOT NULL DEFAULT 'open',
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL
);

-- End of combined schema
