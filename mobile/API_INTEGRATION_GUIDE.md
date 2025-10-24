# Mobile API 集成指南

## 概述

这个指南展示了如何将你的 mobile 应用连接到 Web API，实现以下数据流：

```
Mobile App → Web API (Next.js) → Supabase → Database
```

## 文件结构

```
src/
├── config/
│   └── api.ts                 # API 配置
├── services/
│   ├── api.ts                 # 基础 API 客户端
│   ├── listingsService.ts    # 商品服务
│   ├── authService.ts       # 认证服务
│   ├── userService.ts        # 用户服务
│   ├── feedbackService.ts    # 反馈服务
│   └── index.ts              # 统一导出
└── components/
    ├── ListingsScreen.tsx     # 商品列表组件示例
    └── AuthScreen.tsx         # 认证组件示例
```

## 配置步骤

### 1. 环境配置

复制 `.env.example` 到 `.env` 并设置你的 API URL：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 本地开发
EXPO_PUBLIC_API_URL=http://localhost:3000

# 生产环境（替换为你的实际域名）
# EXPO_PUBLIC_API_URL=https://your-app.vercel.app
```

### 2. 安装依赖

确保已安装必要的依赖：

```bash
npm install @supabase/supabase-js
```

## 使用方法

### 1. 替换 Mock 数据

**之前（使用 Mock 数据）：**
```typescript
import { MOCK_LISTINGS } from '../mocks/shop';

// 直接使用 mock 数据
const listings = MOCK_LISTINGS;
```

**现在（使用 API）：**
```typescript
import { listingsService } from '../services';

// 从 API 获取数据
const listings = await listingsService.getListings();
```

### 2. 商品列表示例

```typescript
import React, { useState, useEffect } from 'react';
import { listingsService } from '../services';

const MyComponent = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const data = await listingsService.getListings();
        setListings(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  // 渲染逻辑...
};
```

### 3. 用户认证与导航规则

```typescript
import { authService } from '../services';

// 用户登录
const handleLogin = async (email: string, password: string) => {
  try {
    const response = await authService.signIn({ email, password });
    console.log('Login successful:', response.user);
    // 登录后根据是否已有偏好（示例：以 gender 是否存在作为判断）决定是否进入偏好引导
    // 实际逻辑已内置在 LoginScreen 中
  } catch (error) {
    console.error('Login failed:', error);
  }
};

// 用户注册
const handleRegister = async (username: string, email: string, password: string) => {
  try {
    const response = await authService.signUp({ username, email, password });
    console.log('Registration successful:', response.user);
  } catch (error) {
    console.error('Registration failed:', error);
  }
};
```

### 4. 数据访问时机

- 登录前不会主动访问需要鉴权的数据接口（如 `/api/listings/my`、`/api/profile`）。
- 首页等需要数据的页面会在检测到 `isAuthenticated === true` 后再触发加载，避免未登录时访问 API（该逻辑已加在 HomeScreen）。

## API 端点

你的 Web API 提供以下端点：

### 商品相关
- `GET /api/listings` - 获取商品列表
- `GET /api/listings/:id` - 获取单个商品

### 认证相关
- `POST /api/auth/signin` - 用户登录
- `POST /api/auth/register` - 用户注册
- `GET /api/auth/me` - 获取当前用户
- `POST /api/auth/signout` - 用户登出

### 用户相关
- `GET /api/profile` - 获取用户资料
- `PUT /api/profile` - 更新用户资料

### 反馈相关
- `GET /api/feedback` - 获取反馈列表
- `POST /api/feedback` - 创建反馈
- `GET /api/feedback/tags` - 获取反馈标签

## 错误处理

所有服务都包含错误处理：

```typescript
try {
  const listings = await listingsService.getListings();
  // 处理成功响应
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.message, error.status);
  } else {
    console.error('Network Error:', error.message);
  }
}
```

## 开发建议

### 1. 本地开发

1. 启动 Web API 服务器：
   ```bash
   cd ../web
   npm run dev
   ```

2. 启动 Mobile 应用：
   ```bash
   cd mobile
   npm start
   ```

3. 确保 `.env` 中的 `EXPO_PUBLIC_API_URL` 设置为 `http://localhost:3000`

### 2. 生产部署

1. 部署 Web API 到 Vercel/Netlify
2. 更新 `.env` 中的 `EXPO_PUBLIC_API_URL` 为生产 URL
3. 重新构建 mobile 应用

### 3. 调试

启用 API 调试日志：

```env
EXPO_PUBLIC_API_DEBUG=true
```

## 安全注意事项

1. **不要在前端暴露 Supabase 密钥**
2. **所有数据库操作都通过 Web API 进行**
3. **在 Web API 层实现权限控制**
4. **使用 HTTPS 进行生产环境通信**

## 下一步

1. 根据你的需求调整 API 端点
2. 实现 token 存储（使用 AsyncStorage）
3. 添加离线支持
4. 实现数据缓存
5. 添加错误重试机制


