// 测试移动端图片上传功能
// 运行方式: node test-image-upload.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testImageUpload() {
  console.log('🧪 Testing Mobile Image Upload...\n');
  
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
    
    // 创建一个简单的测试图片（1x1 像素的 PNG）
    const testImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
    const buffer = Buffer.from(testImageBase64, "base64");
    
    const fileKey = `test-mobile-${Date.now()}.png`;
    
    console.log('🔍 Attempting upload to avatars bucket...');
    
    // 尝试上传到 avatars 存储桶
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileKey, buffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.log(`❌ Upload error: ${uploadError.message}`);
      console.log(`   Code: ${uploadError.statusCode}`);
      console.log(`   Details:`, uploadError);
    } else {
      console.log('✅ Upload successful!');
      console.log('📁 Upload data:', uploadData);
      
      // 获取公共 URL
      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileKey);
      
      console.log('🔗 Public URL:', publicUrlData.publicUrl);
    }
    
  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
  }
}

// 运行测试
testImageUpload().then(() => {
  console.log('\n🎉 Mobile image upload test completed!');
}).catch(console.error);
