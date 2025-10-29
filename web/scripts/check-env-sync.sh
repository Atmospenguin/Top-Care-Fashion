#!/bin/bash

echo "🔍 检测 Vercel 和本地环境变量差异..."

# 检查本地 .env 文件
if [ -f ".env" ]; then
    echo "✅ 找到本地 .env 文件"
    
    # 提取本地 DATABASE_URL
    LOCAL_DB_URL=$(grep "DATABASE_URL=" .env | cut -d'=' -f2- | tr -d '"')
    LOCAL_DIRECT_URL=$(grep "DIRECT_URL=" .env | cut -d'=' -f2- | tr -d '"')
    
    echo "📋 本地 DATABASE_URL: ${LOCAL_DB_URL:0:50}..."
    echo "📋 本地 DIRECT_URL: ${LOCAL_DIRECT_URL:0:50}..."
    
    # 检查是否包含新密码
    if [[ "$LOCAL_DB_URL" == *"Zf9sn76eNuK1ESta"* ]]; then
        echo "✅ 本地 .env 已使用新密码"
    else
        echo "❌ 本地 .env 仍使用旧密码"
    fi
else
    echo "❌ 未找到本地 .env 文件"
fi

echo ""
echo "🔧 建议的 Vercel 环境变量更新："
echo ""
echo "DATABASE_URL=\"postgres://postgres.ilykxrtilsbymlncunua:Zf9sn76eNuK1ESta@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true\""
echo ""
echo "DIRECT_URL=\"postgresql://postgres:Zf9sn76eNuK1ESta@db.ilykxrtilsbymlncunua.supabase.co:5432/postgres?sslmode=require\""
echo ""
echo "📝 请复制上述内容到 Vercel Dashboard → Settings → Environment Variables"
echo "🔄 更新后需要重新部署项目"

