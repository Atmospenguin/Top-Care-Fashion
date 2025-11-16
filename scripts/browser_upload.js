/**
 * 浏览器端批量上传脚本
 * 
 * 使用方法：
 * 1. 在 Top Care Fashion 网站登录
 * 2. 打开浏览器控制台 (F12 → Console)
 * 3. 复制这个文件的内容并粘贴到控制台
 * 4. 运行 uploadFarfetchListings(urls)
 */

// ===== 批量上传函数 =====
async function uploadFarfetchListings(urls) {
  const results = {
    success: [],
    failed: []
  };

  console.log("🚀 开始批量上传 Farfetch 商品");
  console.log(`📦 共 ${urls.length} 个商品待处理\n`);

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`${"=".repeat(70)}`);
    console.log(`[${i + 1}/${urls.length}] 处理: ${url}`);
    
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
        console.error("❌ 抓取失败:", fetchData.error || fetchData.message);
        results.failed.push({ url, error: fetchData.error || fetchData.message });
        continue;
      }

      console.log("📩 服务器返回解析好的 payload");
      console.log(`   - 标题: ${fetchData.payload.title}`);
      console.log(`   - 品牌: ${fetchData.payload.brand}`);
      console.log(`   - 价格: $${fetchData.payload.price || "N/A"}`);
      console.log(`   - 分类: ${fetchData.payload.category}`);
      console.log(`   - 图片: ${fetchData.payload.images.length} 张`);

      // 验证必需字段
      if (!fetchData.payload.title || !fetchData.payload.price) {
        console.error("❌ 缺少必需字段（title 或 price）");
        results.failed.push({ url, error: "Missing required fields" });
        continue;
      }

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
        console.log(`   - ID: ${createData.data.id}`);
        console.log(`   - 标题: ${createData.data.title}`);
        results.success.push({ 
          url, 
          listingId: createData.data.id,
          title: createData.data.title 
        });
      } else {
        console.error("❌ 创建失败:", createData.error || createData.message);
        results.failed.push({ 
          url, 
          error: createData.error || createData.message 
        });
      }

      // 延迟 1-2 秒，避免请求过快
      if (i < urls.length - 1) {
        const delay = 1000 + Math.random() * 1000;
        console.log(`⏳ 等待 ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

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
      console.log(`   - ${item.url}`);
      console.log(`     错误: ${item.error}`);
    });
  }
  console.log("=".repeat(70));

  return results;
}

// ===== 单次上传函数（测试用） =====
async function uploadSingleFarfetch(url) {
  console.log("🚀 开始创建 listing from:", url);
  console.log("-".repeat(70));
  
  try {
    // 步骤1: 抓取数据
    console.log("🌐 请求 TCF 服务器抓取 Farfetch...");
    const fetchResponse = await fetch("/api/fetch-farfetch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });

    const fetchData = await fetchResponse.json();
    console.log("📩 服务器返回:", fetchData);

    if (!fetchData.ok || !fetchData.payload) {
      console.error("❌ 抓取失败:", fetchData.error || fetchData.message);
      return { success: false, error: fetchData.error };
    }

    console.log("\n📋 解析结果:");
    console.log(`   - 标题: ${fetchData.payload.title}`);
    console.log(`   - 品牌: ${fetchData.payload.brand}`);
    console.log(`   - 价格: $${fetchData.payload.price || "N/A"}`);
    console.log(`   - 分类: ${fetchData.payload.category}`);
    console.log(`   - 图片: ${fetchData.payload.images.length} 张`);

    // 步骤2: 创建 listing
    console.log("\n📝 创建 listing...");
    const createResponse = await fetch("/api/listings/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fetchData.payload)
    });

    const createData = await createResponse.json();
    console.log("\n📝 创建结果:", createData);

    if (createResponse.ok && createData.success) {
      console.log("\n🎉 Listing created successfully!");
      console.log(`   - ID: ${createData.data.id}`);
      console.log(`   - 标题: ${createData.data.title}`);
      console.log(`   - 价格: $${createData.data.price}`);
      return { success: true, listing: createData.data };
    } else {
      console.error("\n❌ Failed:", createData.error || createData.message);
      return { success: false, error: createData.error || createData.message };
    }
  } catch (error) {
    console.error("\n❌ 错误:", error);
    return { success: false, error: error.message };
  }
}

// ===== 使用示例 =====
// 取消注释下面的代码来测试

/*
// 单个 URL 测试
uploadSingleFarfetch("https://www.farfetch.com/cn/shopping/women/prada-pleat-detail-dress-item-24273356.aspx");

// 批量上传
const farfetchUrls = [
  "https://www.farfetch.com/cn/shopping/women/prada-pleat-detail-dress-item-24273356.aspx",
  "https://www.farfetch.com/cn/shopping/women/gucci-gg-supreme-mini-dress-item-25631851.aspx",
  // 添加更多 URLs...
];

uploadFarfetchListings(farfetchUrls);
*/

// 导出函数（方便在控制台使用）
window.uploadFarfetchListings = uploadFarfetchListings;
window.uploadSingleFarfetch = uploadSingleFarfetch;

console.log("✅ 脚本已加载！");
console.log("使用方法：");
console.log("  uploadSingleFarfetch('https://www.farfetch.com/...')");
console.log("  uploadFarfetchListings([url1, url2, ...])");

