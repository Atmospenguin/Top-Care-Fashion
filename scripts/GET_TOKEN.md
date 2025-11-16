# 如何获取 AUTH_TOKEN

## 🔑 方法 1：从浏览器开发者工具获取（推荐）

### 步骤：

1. **打开浏览器，访问 Top Care Fashion 网站并登录**
   - 网址：https://top-care-fashion.vercel.app
   - 使用你的账号登录

2. **打开开发者工具**
   - 按 `F12` 或右键页面 → "检查" / "Inspect"
   - 切换到 **Network（网络）** 标签

3. **刷新页面或执行任何操作**（比如查看商品列表）

4. **在 Network 标签中找到任意一个 API 请求**
   - 点击任意请求（比如 `/api/listings` 或 `/api/auth/me`）
   - 在右侧查看 **Request Headers（请求头）**

5. **找到 Authorization 头**
   - 找到类似这样的内容：
     ```
     Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```
   - 复制 `Bearer` 后面的部分（就是你的 token）

## 🔑 方法 2：使用登录 API 获取

如果你有账号密码，可以通过 API 登录获取 token：

```bash
# 使用 curl（如果有的话）
curl -X POST https://top-care-fashion.vercel.app/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"your_email@example.com","password":"your_password"}'
```

响应中会包含 `access_token`，那就是你的 token。

## 🔑 方法 3：从移动端应用获取

如果你有移动端应用：
1. 登录应用
2. 查看应用的存储或日志
3. 找到保存的 `auth_token` 或 `access_token`

## ⚠️ 安全提示

- **不要分享你的 token**，它等同于你的登录凭证
- Token 可能会过期，如果遇到 401 错误，需要重新获取
- 建议定期更换 token

## 📝 Token 格式

Token 通常是一个很长的字符串，类似：
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTIzIiwiaWF0IjoxNjE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

## ✅ 验证 Token 是否有效

获取 token 后，可以测试一下：

```powershell
# PowerShell
$env:AUTH_TOKEN="你的token"
python -c "import requests; r = requests.get('https://top-care-fashion.vercel.app/api/auth/me', headers={'Authorization': f'Bearer {__import__(\"os\").environ[\"AUTH_TOKEN\"]}'}); print('✅ Token 有效' if r.status_code == 200 else '❌ Token 无效')"
```

