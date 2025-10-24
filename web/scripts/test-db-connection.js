const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
  console.log('DATABASE_URL from env:', process.env.DATABASE_URL);
  
  // Try with IPv6 address
  const ipv6Url = process.env.DATABASE_URL.replace('db.ilykxrtilsbymlncunua.supabase.co', '[2406:da18:243:741c:142e:4e96:c7bd:b3ca]');
  console.log('Trying IPv6 URL:', ipv6Url);
  
  const client = new Client({
    connectionString: ipv6Url
  });

  try {
    console.log('Attempting to connect to database...');
    await client.connect();
    console.log('✅ Successfully connected to database!');
    
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Query executed successfully:');
    console.log('Current time:', result.rows[0].current_time);
    
    // Test if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    console.log('✅ Users table exists:', tableCheck.rows[0].exists);
    
    // Test if listings table exists
    const listingsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'listings'
      );
    `);
    
    console.log('✅ Listings table exists:', listingsCheck.rows[0].exists);
    
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
  }
}

testConnection();
