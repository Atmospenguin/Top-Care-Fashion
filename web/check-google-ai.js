#!/usr/bin/env node
// 快速检查 Google Cloud AI 配置
require('dotenv').config();

const required = {
  'GOOGLE_CLOUD_PROJECT': process.env.GOOGLE_CLOUD_PROJECT,
  'GOOGLE_CLIENT_EMAIL': process.env.GOOGLE_CLIENT_EMAIL,
  'GOOGLE_PRIVATE_KEY': process.env.GOOGLE_PRIVATE_KEY,
  'GOOGLE_API_KEY': process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
};

console.log('\n🔍 检查 Google Cloud AI 配置...\n');

const missing = [];
const present = [];

for (const [key, value] of Object.entries(required)) {
  const keyDisplay = key === 'GOOGLE_API_KEY' ? 'GOOGLE_API_KEY (或 GEMINI_API_KEY)' : key;
  if (!value) {
    missing.push(keyDisplay);
    console.log(`❌ ${keyDisplay}: 未配置`);
  } else {
    present.push(keyDisplay);
    const preview = value.length > 50 
      ? value.substring(0, 30) + '...' + value.substring(value.length - 10)
      : value.substring(0, 30) + '...';
    console.log(`✅ ${keyDisplay}: ${preview}`);
  }
}

console.log('\n' + '='.repeat(60));

if (missing.length === 0) {
  console.log('\n🎉 所有配置都已就绪！\n');
  console.log('下一步：');
  console.log('1. 重启 Next.js 服务器: npm run dev');
  console.log('2. 测试 AI 连接: node scripts/test-ai-connection.js');
  console.log('3. 在 App 中测试图片上传功能\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  缺少 ${missing.length} 个必需配置:\n`);
  missing.forEach(key => console.log(`   - ${key}`));
  console.log('\n📝 配置步骤：\n');
  console.log('1. 查看配置指南: web/GOOGLE_AI_SETUP.md');
  console.log('2. 或者快速配置:\n');
  
  if (!required.GOOGLE_CLIENT_EMAIL || !required.GOOGLE_PRIVATE_KEY) {
    console.log('   📌 创建 Google Cloud 服务账号:');
    console.log('      https://console.cloud.google.com/iam-admin/serviceaccounts');
    console.log('      - 创建服务账号');
    console.log('      - 授予 "Cloud Vision API User" 角色');
    console.log('      - 创建 JSON 密钥并下载');
    console.log('      - 从 JSON 文件复制 client_email 和 private_key 到 .env\n');
  }
  
  if (!required.GOOGLE_API_KEY) {
    console.log('   📌 获取 Gemini API Key:');
    console.log('      https://aistudio.google.com/app/apikey');
    console.log('      - 创建 API Key');
    console.log('      - 复制到 .env 文件的 GOOGLE_API_KEY\n');
  }
  
  console.log('3. 编辑 web/.env 文件，添加缺失的配置');
  console.log('4. 重新运行此脚本检查: node check-google-ai.js\n');
  process.exit(1);
}

