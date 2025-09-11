-- Migration script to update reviews system from listing-based to transaction-based
-- Run this script to migrate existing data

USE `top_care_fashion`;

-- Add new columns to users table for rating system
ALTER TABLE users 
ADD COLUMN average_rating DECIMAL(3,2) NULL DEFAULT NULL COMMENT 'Average rating as a user (1.00-5.00)',
ADD COLUMN total_reviews INT NOT NULL DEFAULT 0 COMMENT 'Total number of reviews received';

-- Add sold tracking to listings table  
ALTER TABLE listings 
ADD COLUMN sold TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'True when listing has been sold',
ADD COLUMN sold_at TIMESTAMP NULL COMMENT 'When the listing was sold';

-- Update sold status for listings that have completed transactions
UPDATE listings l 
SET sold = 1, 
    sold_at = (
      SELECT MIN(t.created_at) 
      FROM transactions t 
      WHERE t.listing_id = l.id AND t.status = 'completed'
    )
WHERE l.id IN (
  SELECT DISTINCT listing_id 
  FROM transactions 
  WHERE status = 'completed'
);

-- Create backup of old reviews table
CREATE TABLE reviews_backup AS SELECT * FROM reviews;

-- Drop old reviews table and create new one
DROP TABLE reviews;

CREATE TABLE reviews (
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
  UNIQUE KEY unique_transaction_reviewer (transaction_id, reviewer_id)
);

-- Migrate existing reviews to new structure (if any reviews exist with transaction_id)
-- This will only migrate reviews that already have a transaction_id
INSERT INTO reviews (transaction_id, reviewer_id, reviewee_id, rating, comment, reviewer_type, created_at)
SELECT 
  rb.transaction_id,
  rb.author_user_id,
  CASE 
    WHEN t.buyer_id = rb.author_user_id THEN t.seller_id 
    ELSE t.buyer_id 
  END as reviewee_id,
  rb.rating,
  rb.comment,
  CASE 
    WHEN t.buyer_id = rb.author_user_id THEN 'buyer' 
    ELSE 'seller' 
  END as reviewer_type,
  rb.created_at
FROM reviews_backup rb
JOIN transactions t ON rb.transaction_id = t.id
WHERE rb.transaction_id IS NOT NULL 
  AND rb.author_user_id IS NOT NULL;

-- Update user rating statistics
UPDATE users u SET 
  total_reviews = (
    SELECT COUNT(*) 
    FROM reviews r 
    WHERE r.reviewee_id = u.id
  ),
  average_rating = (
    SELECT AVG(r.rating) 
    FROM reviews r 
    WHERE r.reviewee_id = u.id
    HAVING COUNT(*) > 0
  );

-- Create trigger to update user ratings when reviews are added/updated/deleted
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

DELIMITER ;

-- Note: To complete the migration, you may want to drop the reviews_backup table
-- after confirming the migration was successful:
-- DROP TABLE reviews_backup;
