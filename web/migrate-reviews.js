const mysql = require('mysql2/promise');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'top_care_fashion'
  });

  try {
    console.log('Starting review system migration...');

    // Add new columns to users table
    console.log('Adding rating columns to users table...');
    await connection.execute(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) NULL DEFAULT NULL COMMENT 'Average rating as a user (1.00-5.00)',
      ADD COLUMN IF NOT EXISTS total_reviews INT NOT NULL DEFAULT 0 COMMENT 'Total number of reviews received'
    `);

    // Add sold tracking to listings table  
    console.log('Adding sold tracking to listings table...');
    await connection.execute(`
      ALTER TABLE listings 
      ADD COLUMN IF NOT EXISTS sold TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'True when listing has been sold',
      ADD COLUMN IF NOT EXISTS sold_at TIMESTAMP NULL COMMENT 'When the listing was sold'
    `);

    // Update sold status for listings that have completed transactions
    console.log('Updating sold status for completed transactions...');
    await connection.execute(`
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
      )
    `);

    // Create backup of old reviews table
    console.log('Creating backup of old reviews table...');
    await connection.execute('DROP TABLE IF EXISTS reviews_backup');
    await connection.execute('CREATE TABLE reviews_backup AS SELECT * FROM reviews');

    // Check the structure of the backup table
    console.log('Checking backup table structure...');
    const [columns] = await connection.execute('DESCRIBE reviews_backup');
    console.log('Reviews backup columns:', columns.map(col => col.Field));

    // Drop old reviews table and create new one
    console.log('Recreating reviews table with new structure...');
    await connection.execute('DROP TABLE IF EXISTS reviews');
    await connection.execute(`
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
      )
    `);

    // Check if there are any reviews to migrate
    const [reviewCount] = await connection.execute('SELECT COUNT(*) as count FROM reviews_backup');
    console.log(`Found ${reviewCount[0].count} reviews in backup table`);
    
    if (reviewCount[0].count > 0) {
      // Check if backup has the expected columns for migration
      const columnNames = columns.map(col => col.Field);
      const hasTransactionId = columnNames.includes('transaction_id');
      const hasAuthorUserId = columnNames.includes('author_user_id');
      
      if (hasTransactionId && hasAuthorUserId) {
        console.log('Migrating existing reviews...');
        await connection.execute(`
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
            AND rb.author_user_id IS NOT NULL
        `);
      } else {
        console.log('Cannot migrate reviews - missing required columns (transaction_id or author_user_id)');
        console.log('Available columns:', columnNames);
      }
    }

    // Update user rating statistics
    console.log('Updating user rating statistics...');
    await connection.execute(`
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
        )
    `);

    // Create triggers to update user ratings
    console.log('Creating triggers for automatic rating updates...');
    
    // Drop existing triggers if they exist
    await connection.query('DROP TRIGGER IF EXISTS update_user_rating_after_review_insert');
    await connection.query('DROP TRIGGER IF EXISTS update_user_rating_after_review_update');
    await connection.query('DROP TRIGGER IF EXISTS update_user_rating_after_review_delete');

    await connection.query(`
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
      END
    `);

    await connection.query(`
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
      END
    `);

    await connection.query(`
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
      END
    `);

    console.log('Migration completed successfully!');
    console.log('You can now drop the reviews_backup table if everything looks good.');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the migration if this script is called directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Migration script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };
