Write-Host "🔍 检测 Vercel 和本地环境变量差异..." -ForegroundColor Cyan

# 检查本地 .env 文件
if (Test-Path ".env") {
    Write-Host "✅ 找到本地 .env 文件" -ForegroundColor Green
    
    # 读取 .env 文件内容
    $envContent = Get-Content ".env"
    
    # 提取 DATABASE_URL 和 DIRECT_URL
    $dbUrl = $envContent | Where-Object { $_ -match "^DATABASE_URL=" } | ForEach-Object { $_.Split('=', 2)[1].Trim('"') }
    $directUrl = $envContent | Where-Object { $_ -match "^DIRECT_URL=" } | ForEach-Object { $_.Split('=', 2)[1].Trim('"') }
    
    Write-Host "📋 本地 DATABASE_URL: $($dbUrl.Substring(0, [Math]::Min(50, $dbUrl.Length)))..." -ForegroundColor Yellow
    Write-Host "📋 本地 DIRECT_URL: $($directUrl.Substring(0, [Math]::Min(50, $directUrl.Length)))..." -ForegroundColor Yellow
    
    # 检查是否包含新密码
    if ($dbUrl -like "*Zf9sn76eNuK1ESta*") {
        Write-Host "✅ 本地 .env 已使用新密码" -ForegroundColor Green
    } else {
        Write-Host "❌ 本地 .env 仍使用旧密码" -ForegroundColor Red
    }
} else {
    Write-Host "❌ 未找到本地 .env 文件" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔧 建议的 Vercel 环境变量更新：" -ForegroundColor Cyan
Write-Host ""
Write-Host "DATABASE_URL=`"postgres://postgres.ilykxrtilsbymlncunua:Zf9sn76eNuK1ESta@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true`"" -ForegroundColor Yellow
Write-Host ""
Write-Host 'DIRECT_URL="postgresql://postgres:Zf9sn76eNuK1ESta@db.ilykxrtilsbymlncunua.supabase.co:5432/postgres?sslmode=require"' -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 请复制上述内容到 Vercel Dashboard → Settings → Environment Variables" -ForegroundColor Cyan
Write-Host "🔄 更新后需要重新部署项目" -ForegroundColor Cyan
