# PowerShell 数据库迁移执行脚本
# 按顺序执行所有待执行的迁移

Write-Host "🔄 开始执行数据库迁移..." -ForegroundColor Cyan

# 检查环境变量
if (-not (Test-Path env:DATABASE_URL)) {
    Write-Host "❌ 错误: DATABASE_URL 环境变量未设置" -ForegroundColor Red
    Write-Host "请在 .env 文件中设置 DATABASE_URL" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ DATABASE_URL 已设置" -ForegroundColor Green

# 迁移 1: 添加 payment_method_id 到 orders
Write-Host "`n📝 执行迁移 1: 添加 payment_method_id 到 orders 表..." -ForegroundColor Cyan
psql $env:DATABASE_URL -f add_payment_method_id_to_orders.sql
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 迁移 1 完成" -ForegroundColor Green
} else {
    Write-Host "❌ 迁移 1 失败" -ForegroundColor Red
    exit 1
}

# 迁移 2: 添加佣金字段到 orders
Write-Host "`n📝 执行迁移 2: 添加佣金字段到 orders 表..." -ForegroundColor Cyan
psql $env:DATABASE_URL -f add_commission_to_orders.sql
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 迁移 2 完成" -ForegroundColor Green
} else {
    Write-Host "❌ 迁移 2 失败" -ForegroundColor Red
    exit 1
}

# 迁移 3: 添加使用次数计数器到 users
Write-Host "`n📝 执行迁移 3: 添加使用次数计数器到 users 表..." -ForegroundColor Cyan
psql $env:DATABASE_URL -f add_usage_counters_to_users.sql
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 迁移 3 完成" -ForegroundColor Green
} else {
    Write-Host "❌ 迁移 3 失败" -ForegroundColor Red
    exit 1
}

# 重新生成 Prisma Client
Write-Host "`n📝 重新生成 Prisma Client..." -ForegroundColor Cyan
npx prisma generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Prisma Client 生成完成" -ForegroundColor Green
} else {
    Write-Host "❌ Prisma Client 生成失败" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎉 所有迁移执行完成！" -ForegroundColor Green
Write-Host "`n下一步:" -ForegroundColor Yellow
Write-Host "1. 重启开发服务器: npm run dev"
Write-Host "2. 验证 API 功能正常"
Write-Host "3. 测试用户权益功能"
