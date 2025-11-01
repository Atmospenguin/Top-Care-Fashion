# 🔧 本地 API 配置指南 - 修复 405 错误

## 📌 问题说明

当你点击"Save to Draft"时出现 **HTTP 405 错误**，原因是：

- ❌ 请求发到了**线上 Vercel API**（https://top-care-fashion.vercel.app）
- ❌ 线上环境还**没有部署** `/api/listings/draft` 路由
- ❌ 所以返回 **405 Method Not Allowed**

## ✅ 解决方案

### 方案 1：使用本地 API（推荐开发时使用）

按以下步骤配置，让手机/模拟器访问你电脑上的本地 API：

---

#### 📍 第 1 步：获取你的局域网 IP 地址

**Windows 用户：**
```powershell
ipconfig
# 找到 "无线局域网适配器 WLAN" 或 "以太网适配器"
# 记下 IPv4 地址，例如：192.168.1.100
```

**Mac/Linux 用户：**
```bash
ifconfig | grep "inet "
# 或者
ip addr show
# 找到类似 192.168.x.x 的地址
```

---

#### 📍 第 2 步：修改 `mobile/app.json`

打开 `mobile/app.json`，找到 `extra` 部分，**修改** `EXPO_LOCAL_HOST_ADDRESS`：

```json
"extra": {
  "EXPO_PUBLIC_API_URL": "https://top-care-fashion.vercel.app",
  "EXPO_PUBLIC_PREFER_LOCAL_API": "true",
  "EXPO_PUBLIC_DEV_API_PORT": "3000",
  "EXPO_LOCAL_HOST_ADDRESS": "192.168.1.100",  // ⬅️ 改成你的实际 IP
  "EXPO_PUBLIC_SUPABASE_URL": "...",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY": "..."
}
```

**🔹 不同设备的配置：**

| 设备类型 | `EXPO_LOCAL_HOST_ADDRESS` |
|---------|---------------------------|
| 🤳 **真机（同一 Wi-Fi）** | `192.168.1.100`（你电脑的局域网IP） |
| 🤖 **Android 模拟器** | `10.0.2.2` |
| 🍎 **iOS 模拟器** | `127.0.0.1` 或 `localhost` |

---

#### 📍 第 3 步：启动本地 Next.js API

打开新的终端窗口：

```bash
cd web
npm run dev
```

> ✅ `npm run dev` 已经配置了 `--hostname 0.0.0.0`，允许其他设备访问

**成功启动后会看到：**
```
- Local:        http://0.0.0.0:3000
- Network:      http://192.168.1.100:3000
```

---

#### 📍 第 4 步：重启 Expo

**必须完全重启 Expo 才能加载新配置！**

```bash
cd mobile
# 停止当前的 Expo（Ctrl+C）
npx expo start --clear
```

**✅ 验证是否成功：**

启动后在 Metro 控制台应该看到：

```
[api] Using base URL: http://192.168.1.100:3000
```

✅ 如果看到这个 → 成功连接本地 API  
❌ 如果看到 `https://top-care-fashion.vercel.app` → 还是连到线上了，检查上面的步骤

---

#### 📍 第 5 步：测试"Save to Draft"

1. 打开 App
2. 创建一个 Listing
3. 点击 **"Save to Draft"**
4. 应该返回 **201 Created** ✅

---

### 方案 2：部署到 Vercel（用于生产环境）

如果你需要让**线上版本**也支持草稿功能，需要重新部署：

```bash
cd web

# 确保最新代码已提交
git add .
git commit -m "Add draft API endpoint"
git push origin development

# 部署到生产环境
vercel --prod
```

部署完成后，Vercel 的新版本就会包含 `/api/listings/draft` 路由。

---

## 🧪 调试 Checklist

如果还是 405 错误，按顺序检查：

- [ ] ✅ `app.json` 中 `EXPO_LOCAL_HOST_ADDRESS` 已设置为正确的 IP
- [ ] ✅ 电脑和手机在**同一 Wi-Fi 网络**下（如果用真机）
- [ ] ✅ `web` 目录下 `npm run dev` 已启动
- [ ] ✅ Expo 完全重启（`npx expo start --clear`）
- [ ] ✅ Metro 控制台显示正确的 `base URL`
- [ ] ✅ 防火墙没有阻止 3000 端口

---

## 🚨 常见问题

### Q1: 我看到 "Network request failed"
**A**: 检查：
- 电脑和手机是否在同一网络
- Windows 防火墙是否允许 Node.js 访问网络
- IP 地址是否正确

### Q2: 还是连到 Vercel
**A**: 必须：
1. 修改 `app.json` 后
2. **完全停止** Expo（Ctrl+C）
3. 运行 `npx expo start --clear`（加 `--clear` 清除缓存）

### Q3: Android 模拟器连不上
**A**: Android 模拟器使用特殊的网络映射：
- 把 `EXPO_LOCAL_HOST_ADDRESS` 改成 `10.0.2.2`
- 重启 Expo

---

## 📝 快速命令组合

**开发流程（每次启动）：**

```bash
# 终端 1：启动 Web API
cd web
npm run dev

# 终端 2：启动 Mobile App
cd mobile
npx expo start --clear
```

**切换回线上 API：**

```json
// mobile/app.json
"EXPO_PUBLIC_PREFER_LOCAL_API": "false"  // 改成 false
```

然后重启 Expo。

---

## ✅ 完成！

现在你的 Expo App 会连接到本地 API，`/api/listings/draft` 可以正常使用，不再报 405 错误！

如果有问题，检查 Metro 控制台的日志：`[api] Using base URL: ...`


