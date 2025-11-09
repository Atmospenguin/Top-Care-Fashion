# 清理无图片Listing工具使用指南

## 功能说明

`cleanup-listings-without-images.js` 是一个交互式命令行工具，用于查找并清理数据库中所有没有图片的listing。

### 主要功能

1. **查询无图片的listing** - 自动检测 `image_url` 和 `image_urls` 都为空的listing
2. **详细信息展示** - 显示每个listing的完整信息，包括：
   - 基本信息（ID、名称、价格、品牌、尺码）
   - 分类和状态
   - 库存、浏览量、点赞数
   - 卖家信息
   - 创建时间
   - 图片字段原始值
3. **统计分析** - 提供汇总统计信息
4. **二次确认** - 要求用户两次确认才执行删除操作
5. **安全保护** - 可随时取消操作（Ctrl+C）

## 使用方法

### 前置条件

1. 确保已安装依赖：
   ```bash
   cd web
   npm install
   ```

2. 确保数据库连接配置正确（`.env.local` 文件中的 `DATABASE_URL`）

3. 可选：先运行连接测试
   ```bash
   node scripts/check-db-connection.js
   ```

### 运行脚本

#### 1. 预览模式（推荐）- 只查看，不删除

```bash
# 使用 npm 脚本（推荐）
npm run listings:preview

# 或直接运行
node scripts/preview-listings-without-images.js
```

#### 2. 清理模式 - 交互式删除

```bash
# 使用 npm 脚本（推荐）
npm run listings:cleanup

# 或直接运行
node scripts/cleanup-listings-without-images.js

# 或使用可执行权限运行（如果已添加）
./scripts/cleanup-listings-without-images.js
```

### 操作流程

1. **查看列表** - 脚本会自动查询并显示所有无图片的listing
2. **查看统计** - 检查统计信息，了解将要删除的listing概况
3. **第一次确认** - 输入 `yes` 或 `y` 确认继续
4. **第二次确认** - 输入 `DELETE` 最终确认删除
5. **执行删除** - 脚本会删除所有无图片的listing并显示结果

### 示例输出

```
🔍 清理无图片Listing工具

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 正在连接数据库...
✅ 数据库连接成功

🔎 正在查询无图片的listing...
✅ 查询完成！找到 150 个listing，其中 12 个没有图片

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 无图片Listing列表：

1. ID: 123 | 测试商品
   价格: ¥99.00 | 品牌: Nike | 尺码: M
   分类: 上装 | 状态: GOOD
   库存: 1 | 浏览: 0 | 点赞: 0
   已售出: 否 | 已上架: 是
   卖家: testuser (test@example.com)
   创建时间: 2025-11-09 10:30
   image_url: null
   image_urls: null

...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 统计信息：
   总计: 12 个listing
   已售出: 0 个
   已上架: 8 个
   未上架: 4 个
   总价值: ¥1,234.56
   总浏览量: 25
   总点赞数: 3

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  警告：删除操作不可恢复！

❓ 是否要删除这些无图片的listing？(yes/no): yes
❓ 请再次确认：将删除 12 个listing，输入 "DELETE" 继续: DELETE

🗑️  开始删除无图片的listing...
✅ 成功删除 12 个listing！

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ 清理完成！
```

## 无图片检测逻辑

脚本会将以下情况视为"无图片"：

1. `image_url` 为 `null` 或空字符串
2. `image_urls` 为 `null`
3. `image_urls` 为空数组 `[]`
4. `image_urls` 为只包含空值的数组（如 `["", null]`）
5. `image_urls` 为无法解析的JSON字符串

## 安全特性

### 多重确认机制
- 第一次确认：输入 `yes` 或 `y`
- 第二次确认：必须输入完整的 `DELETE`（大写）
- 任何其他输入都会取消操作

### 中断保护
- 可随时按 `Ctrl+C` 安全退出
- 不会留下不一致的数据状态

### 只读模式预览
如果只想查看哪些listing没有图片而不删除，可以在第一次确认时输入 `no`。

## 故障排查

### 数据库连接失败
```
❌ 发生错误：
Error: P1001: Can't reach database server...
```

**解决方案**：
1. 检查 `.env.local` 文件中的 `DATABASE_URL`
2. 运行 `node scripts/check-db-connection.js` 测试连接
3. 确认 Supabase 项目未暂停（免费版会自动暂停）

### 权限不足
```
❌ 发生错误：
Error: P2010: Insufficient privileges...
```

**解决方案**：
1. 确认数据库用户有 DELETE 权限
2. 检查 Supabase 项目设置中的角色权限

### Prisma 客户端未生成
```
❌ 发生错误：
Cannot find module '@prisma/client'
```

**解决方案**：
```bash
cd web
npm install
npx prisma generate
```

## 注意事项

⚠️ **重要警告**：
- 删除操作不可恢复，请谨慎操作
- 建议先在测试环境运行
- 删除前请确保有数据库备份
- 删除会级联影响相关的 reviews、likes 等数据

💡 **最佳实践**：
- 在生产环境运行前，先在开发/测试环境验证
- 仔细检查列表中的每个listing
- 关注统计信息中的已售出和浏览量数据
- 考虑只删除未上架且无浏览量的listing

## 扩展功能建议

如需更细粒度的控制，可以考虑以下扩展：

1. **选择性删除** - 允许用户选择要删除的特定listing
2. **导出功能** - 在删除前导出listing数据到CSV
3. **软删除** - 标记为删除而不是物理删除
4. **备份功能** - 自动创建删除前的数据备份
5. **过滤条件** - 添加更多过滤选项（如按日期、卖家等）

## 相关脚本

- `check-db-connection.js` - 数据库连接诊断工具
- `/api/admin/listing-images` - 清理孤立图片文件的API

## 技术细节

- **数据库**: PostgreSQL (Supabase)
- **ORM**: Prisma Client
- **Node.js版本**: 14+
- **依赖**: dotenv, @prisma/client, readline (内置)

## 许可与贡献

这是 Top-Care-Fashion 项目的内部工具。如有问题或改进建议，请联系开发团队。
