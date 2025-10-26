#!/bin/bash

# 数据库迁移执行脚本
# 按顺序执行所有待执行的迁移

echo "🔄 开始执行数据库迁移..."

# 检查环境变量
if [ -z "$DATABASE_URL" ]; then
    echo "❌ 错误: DATABASE_URL 环境变量未设置"
    echo "请在 .env 文件中设置 DATABASE_URL"
    exit 1
fi

echo "✅ DATABASE_URL 已设置"

# 迁移 1: 添加 payment_method_id 到 orders
echo ""
echo "📝 执行迁移 1: 添加 payment_method_id 到 orders 表..."
psql "$DATABASE_URL" -f add_payment_method_id_to_orders.sql
if [ $? -eq 0 ]; then
    echo "✅ 迁移 1 完成"
else
    echo "❌ 迁移 1 失败"
    exit 1
fi

# 迁移 2: 添加佣金字段到 orders
echo ""
echo "📝 执行迁移 2: 添加佣金字段到 orders 表..."
psql "$DATABASE_URL" -f add_commission_to_orders.sql
if [ $? -eq 0 ]; then
    echo "✅ 迁移 2 完成"
else
    echo "❌ 迁移 2 失败"
    exit 1
fi

# 迁移 3: 添加使用次数计数器到 users
echo ""
echo "📝 执行迁移 3: 添加使用次数计数器到 users 表..."
psql "$DATABASE_URL" -f add_usage_counters_to_users.sql
if [ $? -eq 0 ]; then
    echo "✅ 迁移 3 完成"
else
    echo "❌ 迁移 3 失败"
    exit 1
fi

# 重新生成 Prisma Client
echo ""
echo "📝 重新生成 Prisma Client..."
npx prisma generate
if [ $? -eq 0 ]; then
    echo "✅ Prisma Client 生成完成"
else
    echo "❌ Prisma Client 生成失败"
    exit 1
fi

echo ""
echo "🎉 所有迁移执行完成！"
echo ""
echo "下一步:"
echo "1. 重启开发服务器: npm run dev"
echo "2. 验证 API 功能正常"
echo "3. 测试用户权益功能"
