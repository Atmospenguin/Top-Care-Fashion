import { NextResponse } from "next/server";

/**
 * Farfetch 商品信息抓取 API
 * 
 * 这个 API 从 Farfetch 商品页面抓取信息，返回符合 CreateListingRequest 格式的数据
 * 
 * 用法：
 *   POST /api/fetch-farfetch
 *   Body: { "url": "https://www.farfetch.com/shopping/women/..." }
 */
export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    // 验证 URL 格式
    if (!url.includes("farfetch.com")) {
      return NextResponse.json({ error: "Invalid Farfetch URL" }, { status: 400 });
    }

    // 强化浏览器伪装 headers
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
      "Accept-Encoding": "gzip, deflate, br",
      "DNT": "1",
      "Connection": "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Cache-Control": "max-age=0",
      "Referer": "https://www.farfetch.com/",
    };

    // 先访问主页获取 cookies（模拟真实浏览器）
    const homeResponse = await fetch("https://www.farfetch.com", {
      headers,
      redirect: "follow",
    });

    // 获取 cookies
    const cookies = homeResponse.headers.get("set-cookie") || "";

    // 使用 cookies 访问目标页面
    const response = await fetch(url, {
      headers: {
        ...headers,
        Cookie: cookies,
      },
      redirect: "follow",
    });

    if (response.status === 403) {
      return NextResponse.json(
        {
          error: "Farfetch blocked the request",
          message: "Farfetch 检测到自动化请求并阻止访问。请稍后重试或手动输入商品信息。",
        },
        { status: 403 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `HTTP ${response.status}: ${response.statusText}` },
        { status: response.status }
      );
    }

    const html = await response.text();

    if (!html || html.length < 500) {
      return NextResponse.json(
        { error: "HTML too short or blocked" },
        { status: 403 }
      );
    }

    // ====== 提取标题和品牌 ======
    let title = "Unknown";
    let brand = "";
    let productName = "";

    // 方法1: 从 og:title meta 标签
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    if (ogTitleMatch) {
      title = ogTitleMatch[1].trim();
    } else {
      // 方法2: 从 title 标签
      const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
      if (titleMatch) {
        title = titleMatch[1].trim();
      } else {
        // 方法3: 从 h1 标签
        const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
        if (h1Match) {
          title = h1Match[1].trim();
        }
      }
    }

    // 清理标题（移除 "| Farfetch" 等后缀）
    title = title.split("|")[0].split("- Farfetch")[0].trim();

    // 提取品牌和产品名
    const words = title.split(/\s+/);
    if (words.length > 1) {
      brand = words[0];
      productName = words.slice(1).join(" ");
    } else {
      brand = title;
      productName = title;
    }

    // ====== 提取价格 ======
    let price = 0;

    // 方法1: 从 product:price:amount meta 标签
    const priceMetaMatch = html.match(/<meta\s+property=["']product:price:amount["']\s+content=["']([^"']+)["']/i);
    if (priceMetaMatch) {
      price = parseFloat(priceMetaMatch[1]);
    }

    // 方法2: 从 JSON-LD 结构化数据
    if (price === 0) {
      const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
      let jsonLdMatch;
      while ((jsonLdMatch = jsonLdRegex.exec(html)) !== null) {
        try {
          const data = JSON.parse(jsonLdMatch[1]);
          if (data.offers) {
            const offers = Array.isArray(data.offers) ? data.offers[0] : data.offers;
            if (offers.price) {
              price = parseFloat(offers.price);
              break;
            }
          }
        } catch (e) {
          // 忽略 JSON 解析错误
        }
      }
    }

    // 方法3: 从 HTML 文本中搜索价格模式
    if (price === 0) {
      const pricePatterns = [
        /"price":\s*([0-9.]+)/,
        /price["']?\s*[:=]\s*["']?([0-9.]+)/,
        /\$\s*([0-9,]+(?:\.[0-9]{2})?)/,
        /€\s*([0-9,]+(?:\.[0-9]{2})?)/,
        /£\s*([0-9,]+(?:\.[0-9]{2})?)/,
      ];

      for (const pattern of pricePatterns) {
        const match = html.match(pattern);
        if (match) {
          price = parseFloat(match[1].replace(/,/g, ""));
          if (price > 0) break;
        }
      }
    }

    // ====== 提取图片 ======
    const images: string[] = [];

    // 方法1: 从 og:image meta 标签
    const ogImageMatches = html.matchAll(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/gi);
    for (const match of ogImageMatches) {
      let imgUrl = match[1];
      if (imgUrl.startsWith("//")) {
        imgUrl = "https:" + imgUrl;
      } else if (imgUrl.startsWith("/")) {
        imgUrl = "https://www.farfetch.com" + imgUrl;
      }
      if (!images.includes(imgUrl)) {
        images.push(imgUrl);
      }
    }

    // 方法2: 从图片标签（优先 farfetch-contents CDN）
    if (images.length === 0) {
      const imgMatches = html.matchAll(/<img[^>]+(?:src|data-src)=["']([^"']+)["'][^>]*>/gi);
      for (const match of imgMatches) {
        let imgUrl = match[1];
        if (imgUrl.includes("farfetch-contents") || imgUrl.includes("farfetch")) {
          if (imgUrl.startsWith("//")) {
            imgUrl = "https:" + imgUrl;
          } else if (imgUrl.startsWith("/")) {
            imgUrl = "https://www.farfetch.com" + imgUrl;
          }
          if (!images.includes(imgUrl)) {
            images.push(imgUrl);
          }
        }
      }
    }

    // ====== 提取描述 ======
    let description = `${brand} ${productName} from Farfetch.`;

    // 从 meta description
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    if (descMatch) {
      description = descMatch[1].trim();
    }

    // ====== 智能分类识别 ======
    let category = "Tops";
    const htmlLower = html.toLowerCase();
    
    if (/jeans|trousers|pants|shorts|skirt/i.test(htmlLower)) {
      category = "Bottoms";
    } else if (/sneakers|boots|sandals|pumps|heels|loafers/i.test(htmlLower)) {
      category = "Footwear";
    } else if (/jacket|coat|bomber|cardigan|cape|blazer|parka|puffer/i.test(htmlLower)) {
      category = "Outerwear";
    } else if (/bag|belt|wallet|scarf|hat|cap|accessories/i.test(htmlLower)) {
      category = "Accessories";
    }

    // ====== 构建返回数据 ======
    const payload = {
      title: `${brand} ${productName}`,
      description,
      price: price > 0 ? price : null,
      category,
      shippingOption: "Standard" as const,
      brand: brand || null,
      condition: "Like New" as const,
      gender: "Women" as const,
      images: images.length > 0 ? images : [],
      quantity: 1,
      listed: true,
      sold: false,
    };

    return NextResponse.json({
      ok: true,
      payload,
    });
  } catch (e: any) {
    console.error("Error fetching Farfetch product:", e);
    return NextResponse.json(
      { error: e.message || "Failed to fetch product" },
      { status: 500 }
    );
  }
}

