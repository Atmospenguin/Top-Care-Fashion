#!/usr/bin/env node
/**
 * Database Connection Diagnostic Tool
 * 用于检查 Supabase 数据库连接配置
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

async function checkConnection() {
  console.log('🔍 Checking database connection...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  const dbUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  if (!dbUrl) {
    console.error('❌ DATABASE_URL is not set!');
    console.log('💡 Please set DATABASE_URL in your .env.local file');
    process.exit(1);
  }

  // Mask password in URL for display
  const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':***@');
  console.log(`   DATABASE_URL: ${maskedUrl ? maskedUrl.substring(0, 100) : 'NOT SET'}`);
  console.log(`   DIRECT_URL: ${directUrl ? 'SET' : 'NOT SET'}`);
  
  // Show full URL structure (without password)
  if (dbUrl) {
    const urlParts = dbUrl.match(/^(postgres(ql)?):\/\/([^:]+):([^@]+)@([^\/]+)\/(.+)$/);
    if (urlParts) {
      console.log(`   Protocol: ${urlParts[1]}`);
      console.log(`   Host: ${urlParts[5]}`);
      console.log(`   Database: ${urlParts[6].split('?')[0]}`);
      const params = urlParts[6].includes('?') ? urlParts[6].split('?')[1] : '';
      if (params) console.log(`   Params: ${params}`);
    }
  }
  console.log('');

  // Check URL format
  console.log('🔍 URL Format Check:');
  if (dbUrl.includes('pooler.supabase.com')) {
    console.log('   ✅ Using pooler connection (correct for queries)');
  } else if (dbUrl.includes('.supabase.co:6543')) {
    console.log('   ✅ Using Supabase pooler port 6543');
  } else if (dbUrl.includes('.supabase.co:5432')) {
    console.log('   ⚠️  Using direct connection port 5432 (should use 6543 for queries)');
  } else {
    console.log('   ⚠️  URL format may be incorrect');
  }

  if (!dbUrl.includes('pgbouncer=true')) {
    console.log('   ⚠️  Missing pgbouncer=true parameter (recommended for pooler)');
  }

  // Check URL protocol
  if (dbUrl.startsWith('postgres://')) {
    console.log('   ⚠️  Using postgres:// protocol (should use postgresql://)');
    console.log('   💡 Prisma recommends postgresql:// protocol');
  }

  console.log('');

  // Try to connect with DATABASE_URL
  console.log('🔌 Testing connection with DATABASE_URL (pooler)...');
  const prisma = new PrismaClient({
    log: ['error'],
  });

  let poolerSuccess = false;
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1 as test`;
    const duration = Date.now() - start;
    console.log(`   ✅ Pooler connection successful! (${duration}ms)`);

    // Test a simple query
    const userCount = await prisma.users.count();
    console.log(`   ✅ Database accessible (${userCount} users found)`);
    poolerSuccess = true;
  } catch (error) {
    console.error('   ❌ Pooler connection failed!');
    console.error(`   Error: ${error.message.split('\n')[0]}\n`);
  } finally {
    await prisma.$disconnect();
  }

  // If pooler failed, try direct connection
  if (!poolerSuccess && directUrl) {
    console.log('🔌 Testing connection with DIRECT_URL (direct connection)...');
    const prismaDirect = new PrismaClient({
      datasources: {
        db: {
          url: directUrl,
        },
      },
      log: ['error'],
    });

    try {
      const start = Date.now();
      await prismaDirect.$queryRaw`SELECT 1 as test`;
      const duration = Date.now() - start;
      console.log(`   ✅ Direct connection successful! (${duration}ms)`);

      const userCount = await prismaDirect.users.count();
      console.log(`   ✅ Database accessible via direct connection (${userCount} users found)`);
      console.log('\n💡 Direct connection works! The issue is with the pooler connection.');
      console.log('   Possible solutions:');
      console.log('   1. Check if pooler is enabled in Supabase Dashboard');
      console.log('   2. Try using the direct connection format:');
      console.log('      DATABASE_URL="postgresql://postgres:[PASSWORD]@db.ilykxrtilsbymlncunua.supabase.co:5432/postgres"');
      console.log('   3. Or use the alternative pooler format:');
      console.log('      DATABASE_URL="postgresql://postgres:[PASSWORD]@db.ilykxrtilsbymlncunua.supabase.co:6543/postgres?pgbouncer=true"');
    } catch (error) {
      console.error('   ❌ Direct connection also failed!');
      console.error(`   Error: ${error.message.split('\n')[0]}\n`);
      console.log('💡 Both connections failed. Possible issues:');
      console.log('   1. Network/firewall blocking connections');
      console.log('   2. Incorrect password in connection string');
      console.log('   3. Database server temporarily unavailable');
      console.log('   4. Check Supabase Dashboard for any service alerts');
    } finally {
      await prismaDirect.$disconnect();
    }
  } else if (!poolerSuccess) {
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Check if your Supabase project is paused (free tier auto-pauses)');
    console.log('   2. Verify DATABASE_URL format in .env.local');
    console.log('   3. Try using DIRECT_URL to test direct connection');
    console.log('   4. Check your network/firewall settings');
    console.log('   5. Ensure URL uses postgresql:// (not postgres://)');
  }
}

checkConnection().catch(console.error);

