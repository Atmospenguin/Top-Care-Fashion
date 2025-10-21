// 测试移动端 Supabase 配置
// 运行方式: node test-mobile-supabase.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testMobileSupabase() {
  console.log('🧪 Testing Mobile Supabase Configuration...\n');
  
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Supabase Anon Key: ${supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'Missing'}\n`);
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing Supabase configuration');
    console.log('Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // 测试连接
    console.log('🔍 Testing Supabase connection...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log(`   ⚠️ Auth error (expected): ${authError.message}`);
    } else {
      console.log(`   ✅ Connection successful`);
    }
    
    // 测试 Storage
    console.log('\n🔍 Testing Storage access...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log(`   ❌ Storage error: ${bucketsError.message}`);
    } else {
      console.log(`   ✅ Found ${buckets.length} buckets:`);
      buckets.forEach(bucket => {
        console.log(`      - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });
    }
    
  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
  }
}

// 运行测试
testMobileSupabase().then(() => {
  console.log('\n✅ Mobile Supabase test completed!');
}).catch((error) => {
  console.error('❌ Test failed:', error);
});
