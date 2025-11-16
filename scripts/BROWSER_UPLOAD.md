# 浏览器端上传脚本（使用后端 API）

如果你的 Python 脚本遇到 403 错误，可以使用这个浏览器端脚本，它通过你的后端 API 来抓取 Farfetch 数据。

## 🎯 工作原理

1. **浏览器端脚本** → 调用你的后端 API `/api/fetch-farfetch`
2. **后端 API** → 从 Farfetch 抓取数据（服务器端，不容易被拦截）
3. **浏览器脚本** → 调用 `/api/listings/create` 创建 listing

## 📝 使用方法

### 步骤 1：确保后端 API 已部署

后端 API 文件已创建在：`web/src/app/api/fetch-farfetch/route.ts`

如果你在本地开发：
```bash
cd web
npm run dev
```

如果你在 Vercel：
- 文件会自动部署
- 或者手动 push 到 GitHub，Vercel 会自动部署

### 步骤 2：在浏览器控制台运行脚本

**方法 A：使用脚本文件（推荐）**

1. **打开 Top Care Fashion 网站并登录**
2. **打开浏览器控制台** (F12 → Console)
3. **复制 `scripts/browser_upload.js` 文件的内容**
4. **粘贴到控制台并运行**

脚本会自动加载，然后你可以直接使用：

```javascript
// 单个 URL 测试
uploadSingleFarfetch("https://www.farfetch.com/cn/shopping/women/prada-pleat-detail-dress-item-24273356.aspx");

// 批量上传
uploadFarfetchListings([
  "https://www.farfetch.com/cn/shopping/women/prada-pleat-detail-dress-item-24273356.aspx",
  "https://www.farfetch.com/cn/shopping/women/gucci-gg-supreme-mini-dress-item-25631851.aspx",
  // 更多 URLs...
]);
```

**方法 B：直接粘贴代码**

如果你想直接粘贴代码，使用以下脚本：

```javascript
// ===== 批量上传脚本 =====
async function uploadFarfetchListings(urls) {
  const results = {
    success: [],
    failed: []
  };

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`\n[${i + 1}/${urls.length}] 处理: ${url}`);
    
    try {
      // 步骤1: 通过后端 API 抓取 Farfetch 数据
      console.log("🌐 请求 TCF 服务器抓取 Farfetch...");
      const fetchResponse = await fetch("/api/fetch-farfetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });

      const fetchData = await fetchResponse.json();

      if (!fetchData.ok || !fetchData.payload) {
        console.error("❌ 抓取失败:", fetchData.error);
        results.failed.push({ url, error: fetchData.error });
        continue;
      }

      console.log("📩 服务器返回解析好的 payload");
      console.log("   - 标题:", fetchData.payload.title);
      console.log("   - 价格:", fetchData.payload.price);
      console.log("   - 分类:", fetchData.payload.category);
      console.log("   - 图片:", fetchData.payload.images.length, "张");

      // 步骤2: 创建 listing
      console.log("📝 创建 listing...");
      const createResponse = await fetch("/api/listings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fetchData.payload)
      });

      const createData = await createResponse.json();

      if (createResponse.ok && createData.success) {
        console.log("🎉 Listing 创建成功!");
        console.log("   - ID:", createData.data.id);
        console.log("   - 标题:", createData.data.title);
        results.success.push({ url, listingId: createData.data.id });
      } else {
        console.error("❌ 创建失败:", createData.error);
        results.failed.push({ url, error: createData.error });
      }

      // 延迟 1-2 秒，避免请求过快
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    } catch (error) {
      console.error("❌ 处理失败:", error);
      results.failed.push({ url, error: error.message });
    }
  }

  // 显示结果
  console.log("\n" + "=".repeat(70));
  console.log(`✅ 成功创建 ${results.success.length} 个 listings`);
  if (results.failed.length > 0) {
    console.log(`❌ 失败 ${results.failed.length} 个:`);
    results.failed.forEach(item => {
      console.log(`   - ${item.url}: ${item.error}`);
    });
  }
  console.log("=".repeat(70));

  return results;
}

// ===== 使用示例 =====
// 准备你的 Farfetch URLs
const farfetchUrls = [
  "https://www.farfetch.com/cn/shopping/women/prada-pleat-detail-dress-item-24273356.aspx",
  "https://www.farfetch.com/cn/shopping/women/gucci-gg-supreme-mini-dress-item-25631851.aspx",
  // 添加更多 URLs...
];

// 运行批量上传
uploadFarfetchListings(farfetchUrls);
```

## 🎯 单次上传（测试用）

如果想先测试单个 URL：

```javascript
async function uploadSingleFarfetch(url) {
  console.log("🚀 Start creating listing from:", url);
  
  // 步骤1: 抓取数据
  const fetchResponse = await fetch("/api/fetch-farfetch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url })
  });

  const fetchData = await fetchResponse.json();
  console.log("📩 服务器返回:", fetchData);

  if (!fetchData.ok) {
    console.error("❌ 抓取失败:", fetchData.error);
    return;
  }

  // 步骤2: 创建 listing
  const createResponse = await fetch("/api/listings/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fetchData.payload)
  });

  const createData = await createResponse.json();
  console.log("📝 创建结果:", createData);

  if (createResponse.ok && createData.success) {
    console.log("🎉 Listing created successfully!");
    console.log("ID:", createData.data.id);
  } else {
    console.error("❌ Failed:", createData.error);
  }
}

// 使用
uploadSingleFarfetch("https://www.farfetch.com/cn/shopping/women/prada-pleat-detail-dress-item-24273356.aspx");
```

## ✅ 优势

1. **绕过反爬虫**：服务器端抓取，不容易被拦截
2. **自动认证**：浏览器自动发送 cookies，不需要手动设置 token
3. **实时反馈**：在控制台看到每一步的进度
4. **无需部署 Python 环境**：直接在浏览器运行

## ⚠️ 注意事项

1. **需要登录**：确保在 Top Care Fashion 网站已登录
2. **后端 API 必须可用**：确保 `/api/fetch-farfetch` 路由已部署
3. **不要关闭浏览器**：脚本运行期间保持页面打开
4. **网络稳定**：确保网络连接稳定

## 🔧 如果后端 API 返回 403

如果后端 API 也返回 403，说明 Farfetch 的反爬虫非常严格。可以：

1. **等待一段时间后重试**
2. **使用手动上传方式**（查看 `MANUAL_UPLOAD_GUIDE.md`）
3. **考虑使用 Selenium 等真实浏览器自动化工具**

