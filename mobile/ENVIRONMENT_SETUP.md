# 环境配置说明

## 问题描述

你的同学无法登录的问题主要是由于环境配置不匹配导致的。从日志可以看到：

```
LOG   API Request -> GET http://192.168.31.225:3000/api/listings/my?status=sold
ERROR  Error fetching user listings: [ApiError: HTTP 401]
```

## 解决方案

### 1. 更新 app.json 配置

每个开发者需要根据自己的网络环境更新 `app.json` 中的 API URL：

```json
{
  "expo": {
    "extra": {
      "EXPO_PUBLIC_SUPABASE_URL": "https://ilykxrtilsbymlncunua.supabase.co",
      "EXPO_PUBLIC_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlseWt4cnRpbHNieW1sbmN1bnVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0OTY1MjEsImV4cCI6MjA3MzA3MjUyMX0.q78hAUkVNeeXxZlY75hQo6cah6m6iBm1_Yh3z_qx-6o",
      "EXPO_PUBLIC_API_URL": "http://YOUR_LOCAL_IP:3000"
    }
  }
}
```

### 2. 获取正确的本地IP地址

**Windows:**
```cmd
ipconfig
```

**Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

找到你的本地IP地址（通常是 192.168.x.x 或 10.x.x.x），然后更新 `EXPO_PUBLIC_API_URL`。

### 3. 确保后端服务运行

确保你的后端服务在正确的端口上运行：

```bash
cd web
npm run dev
```

服务应该运行在 `http://localhost:3000` 或你配置的端口上。

### 4. 网络连接检查

确保移动设备和开发机器在同一个网络下：

1. 移动设备和电脑连接到同一个WiFi网络
2. 防火墙允许3000端口的连接
3. 如果使用VPN，可能需要关闭VPN或配置路由

### 5. 认证问题修复

我们已经修复了以下认证问题：

- ✅ 添加了session自动刷新机制
- ✅ 改进了token管理
- ✅ 添加了401错误重试机制
- ✅ 增强了错误日志记录

### 6. 测试步骤

1. 更新 `app.json` 中的 `EXPO_PUBLIC_API_URL`
2. 重启Expo开发服务器：`npx expo start --clear`
3. 重新安装应用到设备
4. 尝试登录

### 7. 常见问题

**Q: 仍然收到401错误**
A: 检查后端服务是否正常运行，确认API URL配置正确

**Q: 网络连接失败**
A: 确认设备和电脑在同一网络，检查防火墙设置

**Q: Supabase连接问题**
A: 确认Supabase URL和密钥配置正确

## 开发者配置示例

### 开发者A (Cindy)
```json
"EXPO_PUBLIC_API_URL": "http://192.168.0.79:3000"
```

### 开发者B (同学)
```json
"EXPO_PUBLIC_API_URL": "http://192.168.31.225:3000"
```

每个开发者需要根据自己的网络环境更新这个配置。
