# 数据库备份指南

## 📋 概述

在执行 RLS 迁移之前，强烈建议备份数据库。本文档提供了多种备份方法。

## 🔧 方法 1: 使用 PowerShell 脚本 (Windows)

### 前提条件
- 已安装 PostgreSQL 客户端工具（pg_dump）
- 可以从 [PostgreSQL 官网](https://www.postgresql.org/download/) 下载

### 执行步骤

```powershell
cd web
.\backup-database.ps1
```

### 备份文件位置
- 备份文件将保存在 `web/backups/` 目录
- 文件名格式: `backup_YYYYMMDD_HHMMSS.sql.gz`

## 🔧 方法 2: 使用 Bash 脚本 (Linux/macOS)

### 前提条件
- 已安装 PostgreSQL 客户端工具（pg_dump）
- macOS: `brew install postgresql`
- Ubuntu: `sudo apt-get install postgresql-client`

### 执行步骤

```bash
cd web
chmod +x backup-database.sh
./backup-database.sh
```

## 🔧 方法 3: 使用 Supabase CLI

### 前提条件
- 已安装 Supabase CLI
- 已登录 Supabase: `supabase login`

### 执行步骤

```bash
cd web
supabase db dump --project-id ilykxrtilsbymlncunua > backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

## 🔧 方法 4: 手动使用 pg_dump

### 从 .env 文件获取连接信息

```bash
# 从 .env 文件读取 DIRECT_URL
# 格式: postgresql://user:password@host:port/database
```

### 执行备份

```bash
# 设置环境变量
export PGPASSWORD="your_password"

# 执行备份
pg_dump -h aws-1-ap-southeast-1.pooler.supabase.com \
        -p 5432 \
        -U postgres.ilykxrtilsbymlncunua \
        -d postgres \
        -F c \
        -f backups/backup_$(date +%Y%m%d_%H%M%S).sql.gz \
        --verbose \
        --no-owner \
        --no-privileges
```

## 📁 备份文件格式

### 压缩格式 (推荐)
- 格式: Custom format (`.sql.gz`)
- 优点: 文件更小，恢复更快
- 恢复: `pg_restore -d database_name backup_file.sql.gz`

### SQL 格式
- 格式: Plain SQL (`.sql`)
- 优点: 可读性强，可以直接查看
- 恢复: `psql -d database_name -f backup_file.sql`

## 🔄 恢复备份

### 使用 pg_restore (压缩格式)

```bash
# 设置环境变量
export PGPASSWORD="your_password"

# 恢复备份
pg_restore -h aws-1-ap-southeast-1.pooler.supabase.com \
           -p 5432 \
           -U postgres.ilykxrtilsbymlncunua \
           -d postgres \
           -c \
           backups/backup_YYYYMMDD_HHMMSS.sql.gz
```

### 使用 psql (SQL 格式)

```bash
# 设置环境变量
export PGPASSWORD="your_password"

# 恢复备份
psql -h aws-1-ap-southeast-1.pooler.supabase.com \
     -p 5432 \
     -U postgres.ilykxrtilsbymlncunua \
     -d postgres \
     -f backups/backup_YYYYMMDD_HHMMSS.sql
```

## ⚠️ 注意事项

1. **备份大小**: 数据库备份文件可能很大，请确保有足够的磁盘空间
2. **备份时间**: 备份可能需要几分钟时间，取决于数据库大小
3. **连接限制**: 确保数据库连接没有限制
4. **密码安全**: 备份脚本会使用 `.env` 文件中的密码，请确保 `.env` 文件安全
5. **网络连接**: 确保网络连接稳定，避免备份中断

## 🔐 安全建议

1. **不要提交备份文件**: 将 `backups/` 目录添加到 `.gitignore`
2. **加密备份**: 对于敏感数据，考虑加密备份文件
3. **定期备份**: 建议定期备份数据库，不仅仅是迁移前
4. **测试恢复**: 定期测试备份恢复，确保备份可用

## 📊 备份验证

### 检查备份文件

```bash
# 检查备份文件大小
ls -lh backups/

# 验证备份文件完整性 (压缩格式)
pg_restore --list backups/backup_YYYYMMDD_HHMMSS.sql.gz
```

### 测试恢复 (可选)

```bash
# 创建一个测试数据库
createdb test_restore

# 恢复备份到测试数据库
pg_restore -d test_restore backups/backup_YYYYMMDD_HHMMSS.sql.gz

# 验证数据
psql -d test_restore -c "SELECT COUNT(*) FROM users;"
```

## 🚀 快速开始

### Windows

```powershell
cd web
.\backup-database.ps1
```

### Linux/macOS

```bash
cd web
chmod +x backup-database.sh
./backup-database.sh
```

## 📝 备份文件命名

备份文件使用以下命名格式:
- `backup_YYYYMMDD_HHMMSS.sql.gz` (压缩格式)
- `backup_YYYYMMDD_HHMMSS.sql` (SQL 格式)

例如: `backup_20250127_143022.sql.gz`

## 🔗 相关文档

- [PostgreSQL 备份文档](https://www.postgresql.org/docs/current/backup.html)
- [Supabase 备份文档](https://supabase.com/docs/guides/platform/backups)
- [Prisma 迁移文档](https://www.prisma.io/docs/concepts/components/prisma-migrate)

---

*最后更新: 2025-01-27*

