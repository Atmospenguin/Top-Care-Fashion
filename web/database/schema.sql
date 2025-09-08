CREATE DATABASE IF NOT EXISTS marketplace;
USE marketplace;

-- Users
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user','admin') DEFAULT 'user',
  status ENUM('active','suspended') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles (
  user_id INT PRIMARY KEY,
  display_name VARCHAR(100),
  avatar_url VARCHAR(255),
  bio TEXT,
  phone_number VARCHAR(20),
  preferences JSON,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Categories (3 enforced values)
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name ENUM('Top','Bottom','Footwear') NOT NULL UNIQUE
);

-- Items (Catalog)
CREATE TABLE items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  brand VARCHAR(100),
  category_id INT NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Listings (Marketplace Activity)
CREATE TABLE listings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  seller_user_id INT NOT NULL,
  listing_price DECIMAL(10,2) NOT NULL,
  item_condition ENUM('new','used','refurbished') DEFAULT 'used',
  status ENUM('active','sold','unlisted') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id),
  FOREIGN KEY (seller_user_id) REFERENCES users(id)
);

-- Listing Images
CREATE TABLE listing_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  url VARCHAR(255) NOT NULL,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (listing_id) REFERENCES listings(id)
);

-- Reviews (on listings)
CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  author_user_id INT NOT NULL,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES listings(id),
  FOREIGN KEY (author_user_id) REFERENCES users(id)
);

-- Seller Ratings (on sellers)
CREATE TABLE seller_ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  seller_user_id INT NOT NULL,
  rater_user_id INT NOT NULL,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_user_id) REFERENCES users(id),
  FOREIGN KEY (rater_user_id) REFERENCES users(id)
);

CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  buyer_id INT NOT NULL,
  seller_id INT NOT NULL,
  listing_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('credit_card','paypal','cash_on_delivery','bank_transfer') DEFAULT 'credit_card',
  status ENUM('pending','completed','cancelled','refunded') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (buyer_id) REFERENCES users(id),
  FOREIGN KEY (seller_id) REFERENCES users(id),
  FOREIGN KEY (listing_id) REFERENCES listings(id)
);


