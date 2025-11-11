# Top-Care-Fashion 全云端部署架构详解

## 📋 目录
1. [部署架构总览](#部署架构总览)
2. [后端服务部署（Vercel）](#后端服务部署vercel)
3. [数据库部署（Supabase）](#数据库部署supabase)
4. [移动端部署（Expo EAS）](#移动端部署expo-eas)
5. [AI服务集成](#ai服务集成)
6. [存储服务](#存储服务)
7. [环境配置](#环境配置)
8. [CI/CD流程](#cicd流程)
9. [监控与维护](#监控与维护)

---

## 部署架构总览

### 整体架构图
```
┌─────────────────────────────────────────────────────────────┐
│                     用户层 (Client Layer)                     │
├─────────────────────────────────────────────────────────────┤
│  React Native App (iOS/Android)  │  Web Browser (可选)       │
│  └─ Expo EAS Build              │  └─ Next.js SSR            │
└──────────────┬───────────────────┴──────────────┬────────────┘
               │                                   │
               │ HTTPS                             │ HTTPS
               ▼                                   ▼
┌─────────────────────────────────────────────────────────────┐
│                   应用层 (Application Layer)                  │
├─────────────────────────────────────────────────────────────┤
│                  Next.js API Server (Vercel)                 │
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │ API Routes   │ Auth Routes  │ AI Processing Routes     │ │
│  │ - /api/feed  │ - /api/auth  │ - /api/ai/classify       │ │
│  │ - /api/chat  │ - /api/users │ - /api/outfits/analyze   │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
└──────────────┬───────────────────┬──────────────────────────┘
               │                   │
               │ Prisma ORM        │ Supabase Client
               ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                   数据层 (Data Layer)                         │
├─────────────────────────────────────────────────────────────┤
│              Supabase PostgreSQL Database                    │
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │ Users Tables │ Listings     │ Conversations & Messages │ │
│  │ Orders       │ Promotions   │ Notifications            │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
└──────────────┬──────────────────────────────────────────────┘
               │
               │ Supabase Storage API
               ▼
┌─────────────────────────────────────────────────────────────┐
│                   存储层 (Storage Layer)                      │
├─────────────────────────────────────────────────────────────┤
│              Supabase Storage Buckets                        │
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │ listing-img  │ user-avatars │ outfit-images            │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   外部服务 (External Services)                │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │ Google Cloud │ Hugging Face │ OpenAI Gemini            │ │
│  │ Vision API   │ Mixtral-8x7B │ (Product Description)    │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 核心技术栈
- **后端框架**: Next.js 15.5.2 (React 19.1.0)
- **数据库**: Supabase PostgreSQL
- **ORM**: Prisma 6.19.0
- **认证**: Supabase Auth
- **存储**: Supabase Storage
- **部署平台**: 
  - Web: Vercel (Serverless Functions)
  - Mobile: Expo EAS Build
- **AI服务**: 
  - Google Cloud Vision API
  - Hugging Face API (Mixtral-8x7B)
  - OpenAI Gemini

---

## 后端服务部署（Vercel）

### 1. 部署平台：Vercel

**为什么选择 Vercel？**
- ✅ 与 Next.js 原生集成，零配置部署
- ✅ 全球 CDN 加速，自动边缘缓存
- ✅ Serverless Functions，按需扩展
- ✅ 自动 HTTPS 和域名管理
- ✅ 环境变量管理
- ✅ 预览部署（Preview Deployments）

### 2. 部署配置

#### 2.1 Next.js 配置 (`web/next.config.ts`)
```typescript
const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname, // 明确当前目录为 root
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "ilykxrtilsbymlncunua.supabase.co",
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};
```

#### 2.2 构建脚本 (`web/package.json`)
```json
{
  "scripts": {
    "build": "prisma generate && next build --turbopack",
    "start": "next start",
    "postinstall": "prisma generate"
  }
}
```

**关键点：**
- 构建前自动生成 Prisma Client
- 使用 Turbopack 加速构建
- Postinstall 钩子确保 Prisma 客户端始终最新

### 3. Vercel 部署流程

#### 3.1 自动部署
```bash
# 1. 连接到 Vercel
vercel login
vercel link

# 2. 部署到生产环境
vercel --prod

# 3. 或通过 GitHub 集成自动部署
# - 推送到 main 分支 → 自动部署到生产环境
# - 创建 Pull Request → 自动创建预览部署
```

#### 3.2 环境变量配置
在 Vercel Dashboard 中配置以下环境变量：

```env
# 数据库连接
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true&connection_limit=10"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL="https://ilykxrtilsbymlncunua.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[SERVICE-ROLE-KEY]"

# Google Cloud Vision API
GOOGLE_CLOUD_PROJECT="[PROJECT-ID]"
GOOGLE_CLIENT_EMAIL="[CLIENT-EMAIL]"
GOOGLE_PRIVATE_KEY="[PRIVATE-KEY]"

# Hugging Face API
HUGGING_FACE_API_KEY="[API-KEY]"

# OpenAI Gemini
OPENAI_API_KEY="[API-KEY]"
```

### 4. Serverless Functions 配置

#### 4.1 运行时配置
```typescript
// web/src/app/api/ai/classify/route.ts
export const runtime = "nodejs"; // Vision API 需要 Node.js 运行时
export const maxDuration = 30; // 30秒超时
```

#### 4.2 函数区域
Vercel 自动将函数部署到全球多个区域：
- 美国（us-east-1, us-west-1）
- 欧洲（eu-west-1, eu-central-1）
- 亚太（ap-southeast-1, ap-northeast-1）

### 5. 生产环境 URL
- **生产环境**: `https://top-care-fashion.vercel.app`
- **API 端点**: `https://top-care-fashion.vercel.app/api/*`

---

## 数据库部署（Supabase）

### 1. Supabase 架构

#### 1.1 数据库连接
```env
# 运行时连接（池化连接 - 用于查询）
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true&connection_limit=10"

# 迁移连接（直连 - 用于 migrations）
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

**关键区别：**
- **DATABASE_URL**: 使用 PgBouncer 连接池（端口 6543），适合高并发查询
- **DIRECT_URL**: 直连数据库（端口 5432），用于迁移和 DDL 操作

#### 1.2 连接池配置
```typescript
// Prisma Schema (prisma/schema.prisma)
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // 池化连接
  directUrl = env("DIRECT_URL")        // 直连
}
```

### 2. 数据库迁移

#### 2.1 迁移流程
```bash
# 1. 创建迁移
cd web
npx prisma migrate dev --name migration_name

# 2. 应用到生产环境
npx prisma migrate deploy

# 3. 生成 Prisma Client
npx prisma generate
```

#### 2.2 迁移文件结构
```
web/prisma/migrations/
├── 20250106000000_add_listing_stats_daily/
│   └── migration.sql
├── 20251108113000_listing_clicks_unique/
│   └── migration.sql
└── migration_lock.toml
```

### 3. Supabase 功能

#### 3.1 Row Level Security (RLS)
```sql
-- 示例：用户只能查看自己的订单
CREATE POLICY "Users can view their own orders"
ON orders FOR SELECT
USING (auth.uid() = user_id);
```

#### 3.2 数据库函数
```sql
-- 推荐算法函数
CREATE OR REPLACE FUNCTION get_feed_v2(
  p_user_id uuid,
  p_feed_mode text,
  p_limit int,
  p_offset int,
  p_seed_val int,
  p_gender_filter text
) RETURNS TABLE (...)
```

#### 3.3 数据库触发器
```sql
-- Premium 状态同步触发器
CREATE TRIGGER trigger_sync_premium_status
AFTER INSERT OR UPDATE ON premium_subscriptions
FOR EACH ROW
EXECUTE FUNCTION sync_users_premium_status();
```

### 4. 数据库视图

#### 4.1 推荐算法视图
```sql
-- 带 Boost 的推荐视图
CREATE VIEW listing_recommendations_with_boost AS
SELECT
  lr.listing_id,
  lr.fair_score,
  lp.boost_weight,
  CASE
    WHEN lp.status = 'ACTIVE' AND lp.ends_at > NOW() THEN
      lr.fair_score * COALESCE(lp.boost_weight, 1.0)
    ELSE
      lr.fair_score
  END AS final_score
FROM listing_recommendations_main_fair lr
LEFT JOIN listing_promotions lp
  ON lr.listing_id = lp.listing_id
  AND lp.status = 'ACTIVE'
  AND lp.ends_at > NOW();
```

### 5. 数据库备份
- ✅ 自动每日备份
- ✅ 时间点恢复（PITR）
- ✅ 备份保留 7 天（免费计划）或 30 天（付费计划）

---

## 移动端部署（Expo EAS）

### 1. Expo EAS Build 配置

#### 1.1 EAS 配置 (`mobile/eas.json`)
```json
{
  "cli": {
    "version": ">= 16.26.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "ORG_GRADLE_PROJECT_reactNativeArchitectures": "arm64-v8a"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "ORG_GRADLE_PROJECT_reactNativeArchitectures": "arm64-v8a"
      }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "apk"
      },
      "env": {
        "ORG_GRADLE_PROJECT_reactNativeArchitectures": "arm64-v8a"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

#### 1.2 App 配置 (`mobile/app.json`)
```json
{
  "expo": {
    "name": "TOP",
    "slug": "top",
    "version": "1.0.2",
    "extra": {
      "EXPO_PUBLIC_API_URL": "https://top-care-fashion.vercel.app",
      "EXPO_PUBLIC_SUPABASE_URL": "https://ilykxrtilsbymlncunua.supabase.co",
      "EXPO_PUBLIC_SUPABASE_ANON_KEY": "[ANON-KEY]",
      "eas": {
        "projectId": "43fcbd20-cac5-45f7-810b-463059702c7a"
      }
    },
    "ios": {
      "bundleIdentifier": "com.topcarefashion.app"
    },
    "android": {
      "package": "com.topcarefashion.app"
    }
  }
}
```

### 2. 构建流程

#### 2.1 开发构建
```bash
# 开发客户端构建
eas build --profile development --platform ios
eas build --profile development --platform android
```

#### 2.2 预览构建
```bash
# 内部测试构建
eas build --profile preview --platform ios
eas build --profile preview --platform android
```

#### 2.3 生产构建
```bash
# 生产环境构建
eas build --profile production --platform ios
eas build --profile production --platform android
```

### 3. 应用商店提交

#### 3.1 iOS App Store
```bash
# 构建并提交到 App Store
eas build --profile production --platform ios
eas submit --platform ios
```

#### 3.2 Google Play Store
```bash
# 构建并提交到 Google Play
eas build --profile production --platform android
eas submit --platform android
```

### 4. Over-the-Air (OTA) 更新

#### 4.1 发布更新
```bash
# 发布 OTA 更新（不修改原生代码）
eas update --branch production --message "Bug fixes and improvements"
```

#### 4.2 更新策略
- **自动更新**: 用户打开应用时自动检查更新
- **强制更新**: 通过 `expo-updates` 配置强制更新
- **渐进式发布**: 逐步推送更新给用户

### 5. 构建优化

#### 5.1 Android 架构
```json
{
  "env": {
    "ORG_GRADLE_PROJECT_reactNativeArchitectures": "arm64-v8a"
  }
}
```
- 仅构建 ARM64 架构，减小 APK 大小
- 支持 99% 的现代 Android 设备

#### 5.2 版本管理
- 自动递增版本号（`autoIncrement: true`）
- 版本号格式：`1.0.2` (major.minor.patch)

---

## AI服务集成

### 1. Google Cloud Vision API

#### 1.1 配置
```typescript
// web/src/app/api/ai/classify/route.ts
import { ImageAnnotatorClient } from "@google-cloud/vision";

const vision = new ImageAnnotatorClient({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY
  }
});
```

#### 1.2 功能
- **图片分类**: 自动识别服装类别
- **SafeSearch**: 检测成人内容
- **标签识别**: 提取图片标签和描述

#### 1.3 使用场景
```typescript
// 图片分类
const [labelResults] = await vision.labelDetection({
  image: { content: base64 }
});

// SafeSearch 检测
const [safeSearchResults] = await vision.safeSearchDetection({
  image: { content: base64 }
});
```

### 2. Hugging Face API

#### 2.1 配置
```typescript
// 穿搭分析 API
const response = await fetch(
  "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1",
  {
    headers: {
      "Authorization": `Bearer ${process.env.HUGGING_FACE_API_KEY}`
    },
    method: "POST",
    body: JSON.stringify({ inputs: prompt })
  }
);
```

#### 2.2 功能
- **穿搭分析**: 使用 Mixtral-8x7B 分析穿搭搭配
- **风格建议**: 生成个性化穿搭建议
- **评分系统**: 1-10 分评分系统

### 3. OpenAI Gemini

#### 3.1 配置
```typescript
// web/src/app/api/ai/describe/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.OPENAI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
```

#### 3.2 功能
- **产品描述生成**: 根据图片标签生成产品描述
- **内容优化**: 优化用户输入的内容

### 4. AI 服务部署位置
- **运行位置**: Vercel Serverless Functions
- **超时设置**: 30 秒（可配置）
- **错误处理**: 自动降级到规则引擎

---

## 存储服务

### 1. Supabase Storage

#### 1.1 存储桶配置
```typescript
// 主要存储桶
const PRIMARY_BUCKET = "listing-images";

// 备用存储桶
const FALLBACK_BUCKETS = [
  "listing-images-backup",
  "user-avatars",
  "outfit-images"
];
```

#### 1.2 上传流程
```typescript
// web/src/app/api/listings/upload-image/route.ts
const { error: uploadError } = await supabase.storage
  .from(bucket)
  .upload(fileKey, buffer, {
    cacheControl: "3600",
    upsert: false,
    contentType,
  });
```

#### 1.3 存储策略
- **主存储桶**: `listing-images` - 商品图片
- **备用存储桶**: 自动故障转移
- **CDN 加速**: 自动通过 Supabase CDN 加速
- **访问控制**: 通过 RLS 策略控制访问

### 2. 图片优化

#### 2.1 客户端优化
- 图片压缩（React Native）
- 格式转换（JPEG/PNG）
- 尺寸调整

#### 2.2 服务端优化
- 自动生成缩略图
- 懒加载支持
- CDN 缓存（3600 秒）

### 3. 存储配额
- **免费计划**: 1 GB 存储
- **付费计划**: 100 GB+ 存储
- **带宽**: 根据计划限制

---

## 环境配置

### 1. 开发环境

#### 1.1 本地开发
```bash
# Web 开发服务器
cd web
npm run dev  # http://localhost:3000

# Mobile 开发服务器
cd mobile
npx expo start  # Expo Dev Tools
```

#### 1.2 环境变量
```env
# .env.local (开发环境)
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://..."
```

### 2. 生产环境

#### 2.1 Vercel 环境变量
- 在 Vercel Dashboard 中配置
- 支持环境变量加密
- 支持不同环境的不同配置

#### 2.2 移动端环境变量
- 在 `app.json` 中配置 `extra` 字段
- 构建时注入到应用中
- 支持不同构建配置

### 3. 环境变量管理

#### 3.1 敏感信息
- ✅ 使用环境变量存储敏感信息
- ✅ 不在代码中硬编码密钥
- ✅ 使用 Vercel 环境变量加密

#### 3.2 公共变量
- `NEXT_PUBLIC_*`: 可在客户端访问
- `EXPO_PUBLIC_*`: 可在移动端访问

---

## CI/CD流程

### 1. GitHub 集成

#### 1.1 自动部署
```yaml
# .github/workflows/deploy.yml (示例)
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: vercel/action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

#### 1.2 部署流程
1. **代码推送** → GitHub
2. **自动构建** → Vercel
3. **运行测试** → Vitest
4. **部署预览** → Preview URL
5. **生产部署** → Production URL

### 2. 移动端 CI/CD

#### 2.1 EAS Build 集成
```bash
# 通过 GitHub Actions 触发构建
eas build --platform all --profile production --non-interactive
```

#### 2.2 发布流程
1. **代码合并** → main 分支
2. **自动构建** → EAS Build
3. **测试验证** → 内部测试
4. **应用商店提交** → App Store/Play Store

### 3. 数据库迁移

#### 3.1 自动迁移
```bash
# 在部署前自动运行迁移
npx prisma migrate deploy
```

#### 3.2 迁移策略
- ✅ 向后兼容的迁移
- ✅ 分阶段部署
- ✅ 回滚计划

---

## 监控与维护

### 1. 性能监控

#### 1.1 Vercel Analytics
- 实时性能监控
- 错误追踪
- 用户行为分析

#### 1.2 Supabase Dashboard
- 数据库查询性能
- 存储使用情况
- API 调用统计

### 2. 错误追踪

#### 2.1 日志记录
```typescript
// 错误日志
console.error("Error uploading image:", error);

// 性能日志
console.log("Upload successful to bucket:", bucket);
```

#### 2.2 错误处理
- 自动重试机制
- 降级策略
- 用户友好的错误消息

### 3. 维护任务

#### 3.1 定期维护
- 数据库备份验证
- 存储清理
- 性能优化

#### 3.2 更新策略
- 依赖更新
- 安全补丁
- 功能更新

---

## 总结

### 部署架构优势

1. **完全云端化**
   - ✅ 无需自建服务器
   - ✅ 自动扩展
   - ✅ 全球 CDN 加速

2. **高可用性**
   - ✅ 多区域部署
   - ✅ 自动故障转移
   - ✅ 数据库备份

3. **开发效率**
   - ✅ 自动化部署
   - ✅ 预览环境
   - ✅ 快速迭代

4. **成本效益**
   - ✅ 按需付费
   - ✅ 免费计划可用
   - ✅ 无需维护服务器

### 技术栈总结

| 服务 | 平台 | 用途 |
|------|------|------|
| Web 后端 | Vercel | Next.js API 服务 |
| 数据库 | Supabase | PostgreSQL 数据库 |
| 存储 | Supabase | 图片和文件存储 |
| 认证 | Supabase | 用户认证 |
| 移动端 | Expo EAS | React Native 应用 |
| AI 服务 | Google Cloud | 图片识别和分析 |
| AI 服务 | Hugging Face | 穿搭分析 |
| AI 服务 | OpenAI | 内容生成 |

### 下一步优化

1. **性能优化**
   - Redis 缓存层
   - 数据库查询优化
   - CDN 缓存策略

2. **监控增强**
   - 集成 Sentry 错误追踪
   - 性能监控工具
   - 用户行为分析

3. **安全加固**
   - API 速率限制
   - DDoS 防护
   - 数据加密

4. **扩展性**
   - 多区域部署
   - 数据库读写分离
   - 微服务架构

---

## 参考链接

- [Vercel 文档](https://vercel.com/docs)
- [Supabase 文档](https://supabase.com/docs)
- [Expo EAS 文档](https://docs.expo.dev/build/introduction/)
- [Prisma 文档](https://www.prisma.io/docs)
- [Next.js 文档](https://nextjs.org/docs)

