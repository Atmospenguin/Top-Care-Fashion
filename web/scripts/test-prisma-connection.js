const { PrismaClient } = require('@prisma/client');

async function testPrismaConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing Prisma connection...');
    
    // Test basic connection
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`;
    console.log('✅ Database connection successful!');
    console.log('Current time:', result[0].current_time);
    
    // Test if users table exists
    const usersTable = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      ) as exists;
    `;
    console.log('✅ Users table exists:', usersTable[0].exists);
    
    // Test if listings table exists
    const listingsTable = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'listings'
      ) as exists;
    `;
    console.log('✅ Listings table exists:', listingsTable[0].exists);
    
    // Count existing records
    const userCount = await prisma.users.count();
    const listingCount = await prisma.listings.count();
    
    console.log('✅ User records:', userCount);
    console.log('✅ Listing records:', listingCount);
    
    console.log('\n🎉 All database checks passed!');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'P1001') {
      console.error('\n💡 This is a connection error. Possible causes:');
      console.error('   - Database is paused (check Supabase dashboard)');
      console.error('   - Network connectivity issues');
      console.error('   - Incorrect connection string');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaConnection();
