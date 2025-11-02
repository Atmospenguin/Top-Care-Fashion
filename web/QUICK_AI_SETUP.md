# ⚡ Google AI 快速配置指南（5分钟）

## 🎯 目标
让图片上传的 AI 安全检查功能正常工作

## ⚠️ 当前错误
```
ERROR Selection pipeline failed: [ApiError: Safe check failed: HTTP 500 
{"error":"The incoming JSON object does not contain a client_email field"}]
```

---

## 📝 配置步骤

### Step 1: 检查当前配置状态

```bash
cd web
node check-google-ai.js
```

这会告诉你缺少哪些配置。

---

### Step 2: 创建 Google Cloud 服务账号（用于 Vision API）

#### 2.1 创建服务账号

1. 访问 [Google Cloud Console - 服务账号](https://console.cloud.google.com/iam-admin/serviceaccounts)
   
2. 选择或创建项目（项目名随意，例如：`top-care-fashion`）

3. 点击 **"+ 创建服务账号"**
   - **服务账号名称**: `top-care-ai`
   - **描述**: `AI features for Top Care Fashion`
   - 点击 **"创建并继续"**

4. **授予权限**：
   - 搜索并选择 **"Cloud Vision AI API User"**
   - 点击 **"继续"** → **"完成"**

#### 2.2 启用必要的 API

1. 访问 [API Library](https://console.cloud.google.com/apis/library)
2. 搜索并启用：
   - ✅ **Cloud Vision API**
   - ✅ **Generative Language API** (Gemini)

#### 2.3 创建密钥

1. 在服务账号列表中，找到刚创建的 `top-care-ai`
2. 点击右侧的 **"⋮"（更多操作）** → **"管理密钥"**
3. 点击 **"添加密钥"** → **"创建新密钥"**
4. 选择 **JSON** 格式
5. 下载 JSON 文件（例如：`top-care-fashion-xxxxx.json`）

#### 2.4 从 JSON 提取配置

打开下载的 JSON 文件，你会看到：

```json
{
  "type": "service_account",
  "project_id": "top-care-fashion",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n",
  "client_email": "top-care-ai@top-care-fashion.iam.gserviceaccount.com",
  ...
}
```

**复制以下字段：**
- `project_id` → `GOOGLE_CLOUD_PROJECT`
- `client_email` → `GOOGLE_CLIENT_EMAIL`
- `private_key` → `GOOGLE_PRIVATE_KEY`（保留 `\n`，用双引号包裹）

---

### Step 3: 获取 Gemini API Key（用于 AI 描述）

1. 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 点击 **"Create API Key"**
3. 选择你的 Google Cloud 项目
4. 复制生成的 API Key（格式：`AIzaSy...`）

---

### Step 4: 编辑 `.env` 文件

打开 `web/.env`，添加或更新以下配置：

```env
# Google Cloud AI 配置
GOOGLE_CLOUD_PROJECT=top-care-fashion
GOOGLE_CLIENT_EMAIL=top-care-ai@top-care-fashion.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...(你的完整私钥)...\n-----END PRIVATE KEY-----\n"
GOOGLE_API_KEY=AIzaSy...(你的Gemini API Key)...
```

⚠️ **重要提示：**
- `GOOGLE_PRIVATE_KEY` 必须用**双引号**包裹
- 保留 `\n` 字符（不要替换成真实换行）
- 不要删除开头的 `-----BEGIN PRIVATE KEY-----` 和结尾的 `-----END PRIVATE KEY-----`

---

### Step 5: 验证配置

```bash
# 检查配置
node check-google-ai.js

# 测试 AI 连接
node scripts/test-ai-connection.js
```

**成功输出：**
```
🎉 所有配置都已就绪！
✅ Vision API connected successfully
✅ Gemini API connected successfully
```

---

### Step 6: 重启服务器并测试

```bash
# 停止当前的 npm run dev（Ctrl+C）
# 重新启动
npm run dev
```

**测试图片上传：**
1. 打开 App
2. 进入 "Sell" 页面
3. 选择图片
4. 应该看到安全检查通过，图片正常上传 ✅

---

## 🧪 测试清单

配置完成后，依次测试：

- [ ] `node check-google-ai.js` 显示全部 ✅
- [ ] `node scripts/test-ai-connection.js` 成功
- [ ] Next.js 服务器重启
- [ ] App 可以上传图片（没有 500 错误）
- [ ] 保存草稿功能正常
- [ ] 发布 Listing 功能正常

---

## 🔒 安全提示

1. **不要提交 `.env` 到 Git**
   - 确保 `.gitignore` 包含 `.env`

2. **限制 API 使用**
   - 在 Google Cloud Console 设置配额限制
   - 避免滥用导致费用

3. **保管好服务账号密钥**
   - 不要分享 JSON 文件
   - 如果泄露，立即在 Google Cloud Console 删除密钥

---

## 💰 费用说明

### Google Cloud Vision API
- ✅ 免费额度：**1,000 次/月**
- 超出后：$1.50 / 1000 次

### Gemini API  
- ✅ 免费额度：**每分钟 15 次请求**
- Pro 版本有更高配额

**开发测试完全够用！**

---

## 🆘 常见问题

### Q: 配置后还是报错 "client_email not found"
**A**: 
1. 确认 `.env` 文件在 `web/` 目录下（不是项目根目录）
2. 确认 `GOOGLE_CLIENT_EMAIL` 值没有多余的空格或引号
3. **必须重启 Next.js 服务器**才能加载新配置

### Q: private_key 格式错误
**A**: 
- 确保用**双引号**包裹：`"-----BEGIN..."`
- 保留 `\n` 字符（不是真实换行）
- 整个值在一行内

### Q: Vision API 返回 403 错误
**A**: 
- 确认在 Google Cloud Console 启用了 **Cloud Vision API**
- 确认服务账号有正确的权限

### Q: 我不想用 Gemini（AI 描述）
**A**: 
- 可以只配置 Vision API（安全检查）
- Gemini 是可选的，只影响自动生成描述功能

---

## 📚 更多信息

- 📄 详细指南：`web/GOOGLE_AI_SETUP.md`
- 🔗 Google Cloud Vision: https://cloud.google.com/vision/docs
- 🔗 Gemini API: https://ai.google.dev/docs

---

**配置好后，你的图片上传功能就能正常工作了！** 🚀

