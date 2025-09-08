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
    
    // Step 5: Execute additional content tables
    console.log('Creating content tables...');
    const contentTablesPath = path.join(__dirname, 'database', 'add_content_tables.sql');
    const contentTablesContent = await fs.readFile(contentTablesPath, 'utf8');
    
    const contentStatements = contentTablesContent.split(';').filter(stmt => stmt.trim());
    
    for (const statement of contentStatements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
        } catch (error) {
          console.log(`Skipping content table statement: ${statement.substring(0, 50)}...`);
        }
      }
    }
    
    // Step 6: Insert seed data
    console.log('Inserting seed data...');
    const seedPath = path.join(__dirname, 'database', 'seed.sql');
    const seedContent = await fs.readFile(seedPath, 'utf8');
    
    const seedStatements = seedContent.split(';').filter(stmt => stmt.trim());
    
    for (const statement of seedStatements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
        } catch (error) {
          console.log(`Skipping seed statement: ${statement.substring(0, 50)}...`);
        }
      }
    }
    
    // Step 7: Insert additional content data
    console.log('Inserting additional content...');
    
    // Clear existing content to avoid duplicates
    try {
      await connection.execute('DELETE FROM testimonials');
      await connection.execute('DELETE FROM site_stats');
      await connection.execute('DELETE FROM pricing_plans');
      console.log('Cleared existing content data');
    } catch (error) {
      console.log('No existing content to clear');
    }
    
    // Insert testimonials
    try {
      await connection.execute(`
        INSERT INTO testimonials (user_name, text, rating, tags, featured, created_at) VALUES 
        ('Ava', 'Mix & Match nailed my vibe in minutes.', 5, '["mixmatch"]', 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
        ('Leo', 'AI Listing wrote better titles than I do.', 5, '["ailisting"]', 1, DATE_SUB(NOW(), INTERVAL 5 DAY)),
        ('Mia', 'Premium perks are worth it for frequent sellers.', 5, '["premium"]', 1, DATE_SUB(NOW(), INTERVAL 7 DAY)),
        ('Kai', 'Found full outfits with Mix & Match.', 4, '["mixmatch"]', 1, DATE_SUB(NOW(), INTERVAL 19 DAY)),
        ('Zoe', 'AI Listing saved me tons of time.', 5, '["ailisting"]', 1, DATE_SUB(NOW(), INTERVAL 25 DAY))
      `);
      console.log('Testimonials inserted successfully');
    } catch (error) {
      console.log('Testimonials error:', error.message);
    }
    
    // Insert site stats
    try {
      await connection.execute(`
        INSERT INTO site_stats (total_downloads, total_listings, total_sold, avg_rating) VALUES 
        (12000, 38000, 9400, 4.8)
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
