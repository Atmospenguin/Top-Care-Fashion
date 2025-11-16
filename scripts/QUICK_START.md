# 🚀 快速开始指南

## 步骤 1：确定认证方式

运行测试脚本：

```powershell
python scripts/test_api_auth.py
```

这个脚本会告诉你：
- API 是否需要认证
- 使用哪种认证方式（Token 或 Cookie）

## 步骤 2：获取认证信息

### 方式 A：使用 Bearer Token

1. **在浏览器中登录 Top Care Fashion**
2. **打开 DevTools (F12) → Network 标签**
3. **刷新页面或执行任何操作**
4. **找到任意 API 请求，查看 Request Headers**
5. **复制 `Authorization: Bearer xxxxx` 中的 token**

然后设置：

```powershell
$env:AUTH_TOKEN="你的token"
```

### 方式 B：使用 Cookie

1. **在浏览器中登录 Top Care Fashion**
2. **打开 DevTools (F12) → Application → Cookies**
3. **找到 `https://top-care-fashion.vercel.app` 下的 cookies**
4. **查找 Supabase session cookie**（通常是 `sb-xxxxx-auth-token`）
5. **复制所有相关 cookies**，格式：`name1=value1; name2=value2`

然后设置：

```powershell
$env:API_COOKIE="sb-xxxxx-auth-token=xxx; other-cookie=yyy"
```

## 步骤 3：运行脚本

```powershell
# 设置 API URL（可选）
$env:API_BASE_URL="https://top-care-fashion.vercel.app"

# 运行批量上传
python scripts/farfetch_batch_upload.py wishlist_urls.txt
```

## 🔍 如果遇到 401 Unauthorized

说明认证信息不正确，请：

1. **重新检查 token/cookie 是否正确**
2. **确认 token/cookie 是否过期**（重新登录获取新的）
3. **查看 `scripts/CHECK_AUTH.md` 获取详细帮助**

## 📝 完整示例

```powershell
# 1. 设置认证（选择一种方式）
$env:AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
# 或
$env:API_COOKIE="sb-xxxxx-auth-token=xxx"

# 2. 设置 API URL
$env:API_BASE_URL="https://top-care-fashion.vercel.app"

# 3. 运行脚本
python scripts/farfetch_batch_upload.py wishlist_urls.txt
```

