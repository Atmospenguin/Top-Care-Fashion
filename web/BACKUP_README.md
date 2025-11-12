# 数据库备份指南

## 🚀 快速开始

### Windows (PowerShell)

```powershell
cd web
.\backup-database.ps1
```

### Linux/macOS (Bash)

```bash
cd web
chmod +x backup-database.sh
./backup-database.sh
```

## 📋 前提条件

1. **PostgreSQL 客户端工具** (pg_dump)
   - Windows: 从 [PostgreSQL 官网](https://www.postgresql.org/download/) 下载
   - macOS: `brew install postgresql`
   - Ubuntu: `sudo apt-get install postgresql-client`

2. **环境变量文件** (.env)
   - 确保 `web/.env` 文件存在
   - 确保 `DIRECT_URL` 已正确配置

## 📁 备份文件位置

备份文件将保存在 `web/backups/` 目录：
- 文件名格式: `backup_YYYYMMDD_HHMMSS.sql.gz`
- 例如: `backup_20250127_143022.sql.gz`

## 🔄 恢复备份

### 使用 pg_restore (压缩格式)

```powershell
# Windows PowerShell
$env:PGPASSWORD = "your_password"
pg_restore -h aws-1-ap-southeast-1.pooler.supabase.com `
           -p 5432 `
           -U postgres.ilykxrtilsbymlncunua `
           -d postgres `
           -c `
           backups/backup_YYYYMMDD_HHMMSS.sql.gz
```

```bash
# Linux/macOS
export PGPASSWORD="your_password"
pg_restore -h aws-1-ap-southeast-1.pooler.supabase.com \
           -p 5432 \
           -U postgres.ilykxrtilsbymlncunua \
           -d postgres \
           -c \
           backups/backup_YYYYMMDD_HHMMSS.sql.gz
```

## ⚠️ 注意事项

1. **备份大小**: 数据库备份文件可能很大，请确保有足够的磁盘空间
2. **备份时间**: 备份可能需要几分钟时间，取决于数据库大小
3. **网络连接**: 确保网络连接稳定，避免备份中断
4. **密码安全**: 备份脚本会使用 `.env` 文件中的密码，请确保 `.env` 文件安全

## 🔐 安全建议

1. **不要提交备份文件**: 将 `backups/` 目录添加到 `.gitignore`
2. **定期备份**: 建议定期备份数据库，不仅仅是迁移前
3. **测试恢复**: 定期测试备份恢复，确保备份可用

## 📊 验证备份

### 检查备份文件

```powershell
# Windows
Get-ChildItem backups\ | Select-Object Name, Length, LastWriteTime
```

```bash
# Linux/macOS
ls -lh backups/
```

### 验证备份文件完整性

```bash
# 列出备份文件内容（不恢复）
pg_restore --list backups/backup_YYYYMMDD_HHMMSS.sql.gz
```

## 🆘 故障排除

### pg_dump 未找到

如果 `pg_dump` 未找到，可以：
1. 安装 PostgreSQL 客户端工具
2. 使用 Supabase CLI: `supabase db dump --project-id ilykxrtilsbymlncunua > backup.sql`

### 连接失败

如果连接失败，检查：
1. `.env` 文件中的 `DIRECT_URL` 是否正确
2. 网络连接是否正常
3. 数据库是否可访问

### 备份文件太大

如果备份文件太大，可以：
1. 使用压缩格式（默认已启用）
2. 只备份特定表: `pg_dump ... -t table_name`
3. 只备份表结构: `pg_dump ... --schema-only`

## 📝 相关文档

- [PostgreSQL 备份文档](https://www.postgresql.org/docs/current/backup.html)
- [Supabase 备份文档](https://supabase.com/docs/guides/platform/backups)
- [Prisma 迁移文档](https://www.prisma.io/docs/concepts/components/prisma-migrate)

---

*最后更新: 2025-01-27*

