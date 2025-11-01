# 🤖 Google Cloud AI 配置指南

## 📌 为什么需要这个配置？

当用户在 App 中上传图片创建 Listing 时，系统会自动调用 Google Cloud Vision API 进行：
- ✅ **安全检查**（SafeSearch）- 检测不当内容
- ✅ **图片分类**（Label Detection）- 自动识别服装类型
- ✅ **AI 描述**（Gemini）- 生成商品描述

**没有这些配置，上传图片功能会失败！**

---

## 🚨 当前错误

```
ERROR Selection pipeline failed: [ApiError: Safe check failed: HTTP 500 
{"error":"The incoming JSON object does not contain a client_email field"}]
```

这是因为 `web/.env` 缺少以下变量：
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_API_KEY`

---

## 📝 解决方案 - 方案 1：禁用 AI 功能（快速临时方案）

如果你只想测试草稿功能，暂时不需要 AI，可以跳过图片上传或修改代码跳过安全检查。

### 临时禁用安全检查

1. 打开 `mobile/screens/main/SellStack/SellScreen.tsx`
2. 找到 AI 安全检查相关代码
3. 注释掉或跳过

---

## 📝 解决方案 - 方案 2：配置 Google Cloud AI（完整方案）

### Step 1: 创建 Google Cloud 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目（或使用现有项目）
3. 记下 **项目 ID**（例如：`topcarefashion-ai`）

### Step 2: 启用必要的 API

在 Google Cloud Console 中启用：
- ✅ **Cloud Vision API**（图片分析）
- ✅ **Gemini API**（AI 描述生成）

1. 导航到 "APIs & Services" → "Enable APIs and Services"
2. 搜索并启用：
   - Cloud Vision API
   - Generative Language API (Gemini)

### Step 3: 创建服务账号

1. 在 Google Cloud Console 中，导航到：
   **IAM & Admin** → **Service Accounts**

2. 点击 **"Create Service Account"**
   - Name: `top-care-ai-service`
   - Description: `Service account for Top Care Fashion AI features`

3. 授予权限：
   - Role: **Cloud Vision API User**
   - Role: **AI Platform Developer**

4. 点击 **"Create Key"**
   - Key type: **JSON**
   - 下载 JSON 密钥文件（例如：`topcarefashion-ai-xxxx.json`）

### Step 4: 获取 Gemini API Key

1. 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 点击 **"Create API Key"**
3. 选择你的 Google Cloud 项目
4. 复制生成的 API Key

### Step 5: 配置 .env 文件

打开下载的 JSON 服务账号密钥文件，你会看到类似这样的内容：

```json
{
  "type": "service_account",
  "project_id": "topcarefashion-ai",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n",
  "client_email": "top-care-ai-service@topcarefashion-ai.iam.gserviceaccount.com",
  "client_id": "1234567890",
  ...
}
```

**将以下信息添加到 `web/.env` 文件：**

```env
# Google Cloud AI 配置
GOOGLE_CLOUD_PROJECT=topcarefashion-ai
GOOGLE_CLIENT_EMAIL=top-care-ai-service@topcarefashion-ai.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
GOOGLE_API_KEY=AIzaSyD...你的Gemini_API_Key...
```

⚠️ **重要提示：**
- `GOOGLE_PRIVATE_KEY` 必须用**双引号**包裹
- 保留 `\n` 换行符（不要替换成实际换行）
- 不要泄露这些密钥！

### Step 6: 测试连接

```bash
cd web
node scripts/test-ai-connection.js
```

**成功输出：**
```
🔍 Checking environment variables...
✅ All required variables present
✅ Vision API connected successfully
✅ Gemini API connected successfully
```

### Step 7: 重启 Next.js 服务器

```bash
# 停止当前服务器（Ctrl+C）
# 重新启动
npm run dev
```

---

## 🧪 测试 AI 功能

1. 启动 Expo App
2. 进入 "Sell" 页面
3. 选择图片
4. 应该看到：
   - ✅ 安全检查通过
   - ✅ 自动识别类别
   - ✅ 生成 AI 描述

---

## 🔒 安全注意事项

1. **不要提交密钥到 Git**
   - 确保 `.env` 在 `.gitignore` 中
   - 永远不要在代码中硬编码密钥

2. **限制 API 使用**
   - 在 Google Cloud Console 中设置 API 配额限制
   - 启用 API 密钥限制（仅允许特定 API）

3. **监控使用量**
   - Google Cloud Vision: 前 1000 次/月免费
   - Gemini API: 有免费配额限制

---

## 💰 费用说明

### Google Cloud Vision API
- 免费额度：前 1000 次图片分析/月
- 超出后：$1.50 / 1000 次

### Gemini API
- 免费额度：每分钟 15 次请求
- Pro 版本有更高配额

**对于开发测试，免费额度完全足够！**

---

## 🛠️ 常见问题

### Q1: 我不想配置 Google Cloud，有其他方案吗？
**A**: 可以临时禁用 AI 功能，但图片上传功能会受限。建议至少配置基本的安全检查。

### Q2: 配置后还是报错 "client_email not found"
**A**: 检查：
1. `.env` 文件是否在 `web/` 目录下
2. `GOOGLE_CLIENT_EMAIL` 是否正确复制
3. 是否重启了 Next.js 服务器

### Q3: Gemini API 配额不够用
**A**: 
- 开发时可以暂时注释掉 AI 描述功能
- 或申请 Gemini Pro（付费版）

---

## ✅ 完成清单

配置完成后，检查：

- [ ] `web/.env` 包含所有 Google 变量
- [ ] `node scripts/test-ai-connection.js` 通过
- [ ] Next.js 服务器已重启
- [ ] App 中可以正常上传图片
- [ ] 安全检查和分类功能正常

---

## 📚 相关文档

- [Google Cloud Vision API](https://cloud.google.com/vision/docs)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Service Account Keys](https://cloud.google.com/iam/docs/creating-managing-service-account-keys)

---

**如果遇到问题，请检查 Next.js 终端日志中的具体错误信息。**

