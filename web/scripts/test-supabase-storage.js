// 测试 Supabase Storage 配置
// 运行方式: node test-supabase-storage.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// 从环境变量读取配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testSupabaseStorage() {
  console.log('🧪 Testing Supabase Storage Configuration...\n');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing Supabase configuration:');
    console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
    console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`);
    console.log('\n📝 Please check your .env file and ensure these variables are set.');
    return;
  }

  console.log(`✅ Supabase URL: ${supabaseUrl}`);
  console.log(`✅ Supabase Anon Key: ${supabaseAnonKey.substring(0, 20)}...\n`);

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // 测试连接
    console.log('🔍 Testing Supabase connection...');
    const { error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log(`   ⚠️ Auth error (expected): ${authError.message}`);
    } else {
      console.log(`   ✅ Connection successful`);
    }

    // 测试 Storage buckets
    console.log('\n🔍 Testing Storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log(`   ❌ Buckets error: ${bucketsError.message}`);
    } else {
      console.log(`   ✅ Found ${buckets.length} buckets:`);
      buckets.forEach(bucket => {
        console.log(`      - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });
      
      // 检查 avatars bucket
      const avatarsBucket = buckets.find(b => b.name === 'avatars');
      if (avatarsBucket) {
        console.log(`   ✅ 'avatars' bucket exists and is ${avatarsBucket.public ? 'public' : 'private'}`);
      } else {
        console.log(`   ⚠️ 'avatars' bucket not found. You may need to create it.`);
      }
    }

    // 测试上传权限
    console.log('\n🔍 Testing upload permissions...');
    const testFileName = `test-${Date.now()}.txt`;
    const testContent = 'This is a test file';
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(testFileName, testContent, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.log(`   ❌ Upload error: ${uploadError.message}`);
      console.log(`   📝 This might be due to RLS policies or missing bucket.`);
    } else {
      console.log(`   ✅ Upload successful: ${uploadData.path}`);
      
      // 清理测试文件
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([testFileName]);
      
      if (deleteError) {
        console.log(`   ⚠️ Cleanup error: ${deleteError.message}`);
      } else {
        console.log(`   ✅ Test file cleaned up`);
      }
    }

  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
  }
}

// 运行测试
testSupabaseStorage().then(() => {
  console.log('\n✅ Supabase Storage test completed!');
  console.log('\n📝 Next steps:');
  console.log('1. If buckets are missing, create them in Supabase Dashboard');
  console.log('2. If upload fails, check RLS policies in Supabase Dashboard');
  console.log('3. Ensure your environment variables are correct');
}).catch((error) => {
  console.error('❌ Test failed:', error);
});
