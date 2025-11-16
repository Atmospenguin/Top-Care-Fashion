# 如何检查 API 认证方式

## 🔍 方法 1：使用测试脚本（推荐）

运行测试脚本：

```powershell
python scripts/test_api_auth.py
```

这个脚本会自动测试：
- 不带认证的请求
- 带 Bearer token 的请求
- 带 Cookie 的请求

## 🔍 方法 2：在浏览器中测试

### 步骤 1：打开浏览器控制台

1. 访问 https://top-care-fashion.vercel.app
2. 登录你的账号
3. 按 `F12` 打开开发者工具
4. 切换到 **Console（控制台）** 标签

### 步骤 2：测试 API

在控制台中粘贴并运行：

```javascript
fetch("/api/listings/create", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    title: "Test Listing",
    description: "This is a test",
    price: 100,
    category: "Tops",
    shippingOption: "Standard"
  })
})
.then(r => r.json())
.then(data => {
  console.log("状态码:", r.status);
  console.log("响应:", data);
})
.catch(err => console.error("错误:", err));
```

### 结果判断：

- **如果返回 `{ id: xxx, ... }`** → API 不需要认证（或使用 cookie 自动认证）
- **如果返回 `{ error: "Unauthorized" }`** → API 需要认证

## 🔍 方法 3：检查 Cookies

### 步骤：

1. 在浏览器中登录 Top Care Fashion
2. 按 `F12` 打开开发者工具
3. 切换到 **Application（应用程序）** 标签
4. 左侧选择 **Cookies** → **https://top-care-fashion.vercel.app**
5. 查看所有 cookies

### 查找以下 cookies：

- `sb-xxxxx-auth-token` (Supabase)
- `auth-token`
- `session`
- `next-auth.session-token` (NextAuth)
- `tcf_token`
- `__session`
- 任何包含 "auth" 或 "token" 的 cookie

### 如果找到 cookie：

复制 cookie 的 **Name** 和 **Value**，格式如下：

```
cookie_name1=cookie_value1; cookie_name2=cookie_value2
```

然后设置环境变量：

```powershell
$env:API_COOKIE="cookie_name1=cookie_value1; cookie_name2=cookie_value2"
```

## 🔍 方法 4：检查 Network 请求

### 步骤：

1. 在浏览器中登录并创建一个 listing（通过正常流程）
2. 按 `F12` 打开开发者工具
3. 切换到 **Network（网络）** 标签
4. 创建 listing 时，找到 `/api/listings/create` 请求
5. 点击该请求，查看 **Headers（请求头）**

### 查看以下内容：

- **Request Headers** 中是否有 `Authorization: Bearer ...`
- **Request Headers** 中是否有 `Cookie: ...`
- **Request Headers** 中是否有其他认证相关的 header

## 📸 需要的信息

请提供以下信息之一：

1. **测试脚本的输出结果**
2. **浏览器控制台测试的结果**
3. **Cookies 截图**（Application → Cookies）
4. **Network 请求的 Headers 截图**

有了这些信息，我就能：
- ✅ 确定正确的认证方式
- ✅ 更新脚本以使用正确的认证
- ✅ 确保脚本可以正常工作

## 🎯 快速检查清单

- [ ] 运行了 `test_api_auth.py` 脚本
- [ ] 在浏览器控制台测试了 API
- [ ] 检查了 Application → Cookies
- [ ] 检查了 Network → Headers
- [ ] 记录了所有认证相关的信息

