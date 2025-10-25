#!/usr/bin/env node

console.log('🎯 TOP Care Fashion - 自动部署欢迎消息触发器');
console.log('===============================================');

// 检查环境
const fs = require('fs');
const path = require('path');

// 检查 .env 文件
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ 未找到 .env 文件');
  console.log('📝 请先创建 .env 文件，参考 env.example');
  console.log('💡 或者手动在 Supabase Dashboard 中执行 final_welcome_trigger.sql');
  process.exit(1);
}

console.log('✅ 找到 .env 文件');

// 检查 Prisma 客户端
try {
  const { PrismaClient } = require('@prisma/client');
  console.log('✅ Prisma 客户端可用');
} catch (error) {
  console.log('❌ Prisma 客户端不可用，请先运行: npm install');
  process.exit(1);
}

// 检查触发器 SQL 文件
const triggerSqlPath = path.join(__dirname, 'supabase', 'final_welcome_trigger.sql');
if (!fs.existsSync(triggerSqlPath)) {
  console.log('❌ 未找到触发器 SQL 文件:', triggerSqlPath);
  process.exit(1);
}

console.log('✅ 找到触发器 SQL 文件');

// 执行部署
console.log('🚀 开始部署...');
require('./deploy-trigger.js');

