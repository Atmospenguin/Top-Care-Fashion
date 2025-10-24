# 新用户自动欢迎消息功能

## 🎯 功能说明

当新用户注册时，系统会自动：
1. 创建与 TOP Support 的对话
2. 发送一条欢迎消息："Hey @用户名, Welcome to TOP! 👋"

## 🚀 使用方法

### 方法 1：在 Supabase Dashboard 中执行

1. 登录 Supabase Dashboard
2. 进入你的项目
3. 点击左侧菜单的 "SQL Editor"
4. 复制 `simple_welcome_trigger.sql` 文件中的内容
5. 粘贴到 SQL Editor 中
6. 点击 "Run" 执行

### 方法 2：通过 Prisma Migration

1. 在 `web` 目录下运行：
   ```bash
   npx prisma migrate dev --name add_welcome_message_trigger
   ```

2. 在生成的 migration 文件中添加 SQL 内容

## 📊 数据库结构

### conversations 表
- `initiator_id`: 新用户的 ID
- `participant_id`: 1 (TOP Support 的固定 ID)
- `type`: 'SUPPORT'
- `status`: 'ACTIVE'

### messages 表
- `sender_id`: 1 (TOP Support 发送)
- `receiver_id`: 新用户的 ID
- `content`: "Hey @用户名, Welcome to TOP! 👋"
- `message_type`: 'TEXT'

## ✅ 验证功能

1. 注册一个新用户
2. 检查 `conversations` 表是否有新记录
3. 检查 `messages` 表是否有欢迎消息
4. 在移动端查看 InboxScreen 是否显示欢迎消息

## 🔧 故障排除

如果触发器不工作：
1. 检查 TOP Support 用户是否存在（ID = 1）
2. 检查触发器是否正确创建
3. 查看 Supabase 日志中的错误信息

## 📝 注意事项

- 触发器只在用户注册时执行一次
- 不会影响现有用户
- TOP Support 用户（ID = 1）不会触发欢迎消息
- 所有新用户都会自动收到欢迎消息

