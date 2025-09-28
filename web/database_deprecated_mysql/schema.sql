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
  dob DATE NULL,
  gender ENUM('Male','Female') NULL,
  role ENUM('User','Admin') NOT NULL DEFAULT 'User',
  status ENUM('active','suspended') NOT NULL DEFAULT 'active',
  is_premium TINYINT(1) NOT NULL DEFAULT 0,
  premium_until TIMESTAMP NULL,
  average_rating DECIMAL(3,2) NULL DEFAULT NULL COMMENT 'Average rating as a user (1.00-5.00)',
  total_reviews INT NOT NULL DEFAULT 0 COMMENT 'Total number of reviews received',
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
  sold TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'True when listing has been sold',
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url VARCHAR(500) NULL,
  image_urls TEXT NULL COMMENT 'JSON array of image URLs',
  brand VARCHAR(100) NULL,
  size VARCHAR(50) NULL,
  condition_type ENUM('new','like_new','good','fair','poor') DEFAULT 'good',
  tags TEXT NULL COMMENT 'JSON array of tags',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sold_at TIMESTAMP NULL COMMENT 'When the listing was sold',
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
  CONSTRAINT fk_tx_listing FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE RESTRICT,
  UNIQUE KEY unique_listing_transaction (listing_id)
);

-- Reviews are now tied to transactions, not listings
-- Each transaction can have up to 2 reviews: one from buyer, one from seller
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  reviewee_id INT NOT NULL,
  rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  reviewer_type ENUM('buyer','seller') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_reviewee FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_transaction_reviewer (transaction_id, reviewer_id),
  UNIQUE KEY unique_transaction_reviewer_type (transaction_id, reviewer_type)
);

-- Unified feedback system (includes both user feedback and testimonials)
CREATE TABLE IF NOT EXISTS feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  user_email VARCHAR(191) NULL,
  user_name VARCHAR(100) NULL,
  message TEXT NOT NULL,
  rating TINYINT NULL DEFAULT NULL,
  tags JSON NULL,
  featured TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS faq (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  user_email VARCHAR(191) NULL,
  question TEXT NOT NULL,
  answer TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  answered_at TIMESTAMP NULL,
  CONSTRAINT fk_faq_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
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
  total_users INT NOT NULL DEFAULT 0,
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
  mixmatch_limit INT NULL,
  free_promotion_credits INT NULL,
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

-- Triggers: keep in sync with init-db.js to maintain automatic updates for listings and user ratings
-- Update user rating aggregates when reviews change
DELIMITER $$

CREATE TRIGGER update_user_rating_after_review_insert
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
  UPDATE users
  SET total_reviews = (
    SELECT COUNT(*) FROM reviews WHERE reviewee_id = NEW.reviewee_id
  ),
  average_rating = (
    SELECT AVG(rating) FROM reviews WHERE reviewee_id = NEW.reviewee_id
  )
  WHERE id = NEW.reviewee_id;
END$$

CREATE TRIGGER update_user_rating_after_review_update
AFTER UPDATE ON reviews
FOR EACH ROW
BEGIN
  -- Update old reviewee if changed
  IF OLD.reviewee_id != NEW.reviewee_id THEN
    UPDATE users
    SET total_reviews = (
      SELECT COUNT(*) FROM reviews WHERE reviewee_id = OLD.reviewee_id
    ),
    average_rating = (
      SELECT AVG(rating) FROM reviews WHERE reviewee_id = OLD.reviewee_id
    )
    WHERE id = OLD.reviewee_id;
  END IF;
  
  -- Update new reviewee
  UPDATE users
  SET total_reviews = (
    SELECT COUNT(*) FROM reviews WHERE reviewee_id = NEW.reviewee_id
  ),
  average_rating = (
    SELECT AVG(rating) FROM reviews WHERE reviewee_id = NEW.reviewee_id
  )
  WHERE id = NEW.reviewee_id;
END$$

CREATE TRIGGER update_user_rating_after_review_delete
AFTER DELETE ON reviews
FOR EACH ROW
BEGIN
  UPDATE users
  SET total_reviews = (
    SELECT COUNT(*) FROM reviews WHERE reviewee_id = OLD.reviewee_id
  ),
  average_rating = (
    SELECT AVG(rating) FROM reviews WHERE reviewee_id = OLD.reviewee_id
  )
  WHERE id = OLD.reviewee_id;
END$$

-- Unlist listing automatically once a transaction is created for it
CREATE TRIGGER unlist_listing_after_transaction_insert
AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
  UPDATE listings SET listed = 0 WHERE id = NEW.listing_id;
END$$

-- Mark listing sold when a transaction is completed
CREATE TRIGGER mark_listing_sold_after_transaction_update
AFTER UPDATE ON transactions
FOR EACH ROW
BEGIN
  IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
    UPDATE listings SET sold = 1, sold_at = NOW() WHERE id = NEW.listing_id;
  END IF;
END$$

-- Ensure only buyer or seller can review, and reviewee is the opposite party
CREATE TRIGGER validate_review_participants_before_insert
BEFORE INSERT ON reviews
FOR EACH ROW
BEGIN
  DECLARE b INT; DECLARE s INT;
  SELECT buyer_id, seller_id INTO b, s FROM transactions WHERE id = NEW.transaction_id;
  IF b IS NULL OR s IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid transaction for review';
  END IF;
  IF NOT (NEW.reviewer_id = b OR NEW.reviewer_id = s) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Reviewer must be buyer or seller of the transaction';
  END IF;
  IF NOT (NEW.reviewee_id = b OR NEW.reviewee_id = s) OR NEW.reviewee_id = NEW.reviewer_id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Reviewee must be the counterparty';
  END IF;
END$$

DELIMITER ;

-- End of combined schema

