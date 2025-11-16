import base64
import json
import os
import re
import time
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

import requests
from bs4 import BeautifulSoup


# ===========================
# 辅助：枚举映射 & Tag 逻辑
# ===========================

CONDITION_MAP = {
    "brand new": "Brand New",
    "new": "Brand New",
    "like new": "Like New",
    "good": "Good",
    "fair": "Fair",
    "poor": "Poor",
}

GENDER_MAP = {
    "men": "Men",
    "male": "Men",
    "women": "Women",
    "female": "Women",
    "unisex": "Unisex",
    "uni": "Unisex",
    "all": "Unisex",
}

VALID_CATEGORIES = {"Accessories", "Bottoms", "Footwear", "Outerwear", "Tops"}

SPECIAL_BRANDS: Dict[str, List[str]] = {
    "Vivienne Westwood": ["designer", "luxury", "vintage"],
    "Chanel": ["designer", "luxury", "premium"],
    "Gucci": ["designer", "luxury", "premium"],
    "Prada": ["designer", "luxury"],
    "Louis Vuitton": ["designer", "luxury", "premium"],
}


def normalize_tags(tags: Optional[List[str]]) -> List[str]:
    """规范化 tags：去重、去空格、小写。"""
    if not tags:
        return []
    norm: List[str] = []
    for t in tags:
        if not t:
            continue
        v = t.strip().lower()
        if v and v not in norm:
            norm.append(v)
    return norm


def add_special_brand_tags(brand: Optional[str], existing_tags: Optional[List[str]]) -> List[str]:
    """对特殊品牌自动附加 designer/luxury 等标签。"""
    tags = normalize_tags(existing_tags)
    if not brand:
        return tags
    extra = SPECIAL_BRANDS.get(brand, [])
    for t in extra:
        v = t.lower().strip()
        if v and v not in tags:
            tags.append(v)
    return tags


def guess_category_from_text(text: str) -> str:
    """简单 heuristic：根据 Farfetch 页面文字猜测 ListingCategory。"""
    t = text.lower()

    if any(k in t for k in ["jeans", "trousers", "pants", "shorts", "skirt"]):
        return "Bottoms"
    if any(k in t for k in ["sneakers", "boots", "sandals", "pumps", "heels", "loafers"]):
        return "Footwear"
    if any(
        k in t
        for k in [
            "jacket",
            "coat",
            "bomber",
            "cardigan",
            "cape",
            "blazer",
            "parka",
            "puffer",
        ]
    ):
        return "Outerwear"
    if any(k in t for k in ["bag", "belt", "wallet", "scarf", "hat", "cap", "accessories"]):
        return "Accessories"
    return "Tops"


def parse_price_from_html(html: str) -> Optional[float]:
    """从 HTML 里粗略抓一个价格（¥ / $ / € / £），只保留数字+小数点。"""
    m = re.search(r"([$€£¥]\s*[\d,]+(?:\.\d+)?)", html)
    if not m:
        return None
    raw = m.group(1)
    numeric = re.sub(r"[^\d.]", "", raw)
    try:
        return float(numeric)
    except ValueError:
        return None


def extract_text_list_after_heading(soup: BeautifulSoup, heading_text: str) -> List[str]:
    """在"Highlights""Composition"这种 heading 后面抓 bullet list。"""
    results: List[str] = []
    heading = None
    for node in soup.find_all(text=True):
        if isinstance(node, str) and heading_text.lower() in node.strip().lower():
            heading = node.parent
            break

    if not heading:
        return results

    ul = heading.find_next("ul")
    if ul:
        for li in ul.find_all("li"):
            t = li.get_text(strip=True)
            if t:
                results.append(t)
    else:
        nxt = heading
        for _ in range(10):
            nxt = nxt.find_next_sibling()
            if not nxt:
                break
            t = nxt.get_text(strip=True)
            if t:
                results.append(t)

    return results


# ===========================
# TCFClient：SDK 主体
# ===========================

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": (
        "text/html,application/xhtml+xml,application/xml;q=0.9,"
        "image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"
    ),
    "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "DNT": "1",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Cache-Control": "max-age=0",
}


@dataclass
class TCFClient:
    base_url: str
    token: str = ""
    cookie: str = ""  # 可选：Cookie 字符串用于认证
    timeout: int = 30
    
    def __post_init__(self):
        """初始化后设置 cookie"""
        if self.cookie:
            self.set_cookie(self.cookie)

    # ---------- 基础 HTTP 封装 ----------

    @property
    def _auth_headers(self) -> Dict[str, str]:
        """构建认证 headers，支持 Bearer token 或 Cookie"""
        headers = {
            "Content-Type": "application/json",
        }
        
        # 如果提供了 token，使用 Bearer token
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        
        return headers
    
    def set_cookie(self, cookie_string: str):
        """设置 Cookie 用于认证（替代或补充 Bearer token）"""
        self._cookie = cookie_string
    
    @property
    def _cookie(self) -> Optional[str]:
        """获取 Cookie 字符串"""
        return getattr(self, '_cookie_value', None)
    
    @_cookie.setter
    def _cookie(self, value: str):
        """设置 Cookie 字符串"""
        self._cookie_value = value

    def _post(self, path: str, json_body: Dict[str, Any]) -> Tuple[int, Any]:
        url = self.base_url.rstrip("/") + path
        headers = self._auth_headers.copy()
        
        # 如果设置了 Cookie，添加到 headers
        if self._cookie:
            headers["Cookie"] = self._cookie
        
        resp = requests.post(url, headers=headers, json=json_body, timeout=self.timeout)
        try:
            data = resp.json()
        except Exception:
            data = resp.text
        return resp.status_code, data

    # ---------- 上传图片 ----------

    def upload_image_file(self, image_path: str) -> Optional[str]:
        """读取本地文件 → base64 → 调用 /api/listings/upload-image → 返回 imageUrl。"""
        if not os.path.exists(image_path):
            print(f"❌ 图片不存在: {image_path}")
            return None

        with open(image_path, "rb") as f:
            image_data = f.read()
        b64 = base64.b64encode(image_data).decode("utf-8")
        filename = os.path.basename(image_path)

        payload = {"imageData": b64, "fileName": filename}

        status, data = self._post("/api/listings/upload-image", payload)
        if status == 200 and isinstance(data, dict) and data.get("imageUrl"):
            url = data["imageUrl"]
            print(f"✅ 图片上传成功: {url}")
            return url

        print(f"❌ 图片上传失败: HTTP {status}, 响应: {data}")
        return None

    # ---------- 创建 Listing ----------

    def create_listing(self, listing_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        按照你给的 CreateListingRequest schema 调用 /api/listings/create。
        自动处理错误信息。
        """
        status, data = self._post("/api/listings/create", listing_data)

        if status == 200 and isinstance(data, dict) and data.get("success") and data.get("data"):
            print(f"✅ Listing 创建成功: {data['data'].get('id')} | {data['data'].get('title')}")
            return data["data"]

        # 错误处理
        if status == 401:
            print("❌ 401 Unauthorized: Token 无效或已过期")
        elif status == 403:
            print(f"❌ 403 Forbidden: {data}")
        elif status == 400:
            print(f"❌ 400 Bad Request: {data}")
        else:
            print(f"❌ 创建失败 HTTP {status}: {data}")
        return None

    # ===========================
    # Farfetch 解析 + 映射到 Listing Schema
    # ===========================

    def scrape_farfetch_product(self, url: str) -> Optional[Dict[str, Any]]:
        """
        从 Farfetch 商品页面抓取信息，生成符合 CreateListingRequest 的 dict。
        """
        print(f"🌐 抓取 Farfetch 商品: {url}")
        
        # 强化浏览器伪装 headers
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            "Accept": (
                "text/html,application/xhtml+xml,application/xml;q=0.9,"
                "image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"
            ),
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
        }
        
        # 创建 session 以保持 cookies 和连接
        session = requests.Session()
        session.headers.update(headers)
        
        # 重试机制（最多3次）
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # 先访问主页获取 cookies（模拟真实浏览器行为）
                if attempt == 0:
                    print("   📍 访问主页获取 cookies...")
                    session.get("https://www.farfetch.com", timeout=self.timeout)
                    time.sleep(1 + attempt * 0.5)  # 递增延迟
                
                # 访问目标页面
                print(f"   🔄 尝试访问商品页面 (第 {attempt + 1}/{max_retries} 次)...")
                resp = session.get(url, timeout=self.timeout, allow_redirects=True)
                
                if resp.status_code == 200:
                    print("   ✅ 获取页面成功")
                    break
                elif resp.status_code == 403:
                    if attempt < max_retries - 1:
                        wait_time = (attempt + 1) * 2
                        print(f"   ⚠️ HTTP 403，等待 {wait_time} 秒后重试...")
                        time.sleep(wait_time)
                        continue
                    else:
                        print(f"   ❌ HTTP 403 Forbidden - Farfetch 检测到自动化请求")
                        print(f"      建议：1) 手动在浏览器中打开页面获取信息")
                        print(f"            2) 或者使用浏览器扩展导出数据")
                        print(f"            3) 或者等待更长时间后重试")
                        return None
                else:
                    print(f"   ❌ HTTP {resp.status_code} 获取页面失败")
                    if attempt < max_retries - 1:
                        time.sleep(2)
                        continue
                    return None
                    
            except requests.RequestException as e:
                print(f"   ❌ 请求失败: {e}")
                if attempt < max_retries - 1:
                    time.sleep(2)
                    continue
                return None
        else:
            # 所有重试都失败了
            return None

        html = resp.text
        soup = BeautifulSoup(html, "html.parser")

        # ----- 标题 & 品牌 -----
        og_title_tag = soup.find("meta", property="og:title")
        if og_title_tag and og_title_tag.get("content"):
            og_title = og_title_tag["content"].strip()
        else:
            # 尝试从 title 标签获取
            title_tag = soup.find("title")
            if title_tag and title_tag.string:
                og_title = title_tag.string.strip()
            else:
                # 尝试从 h1 或其他标题标签获取
                h1_tag = soup.find("h1")
                if h1_tag:
                    og_title = h1_tag.get_text(strip=True)
                else:
                    og_title = "Untitled"

        # 清理标题（移除 "| Farfetch" 等后缀）
        main_part = og_title.split("|")[0].strip()
        main_part = main_part.split("- Farfetch")[0].strip()
        
        words = main_part.split()
        if len(words) > 1:
            brand = words[0]
            product_name = " ".join(words[1:])
        else:
            brand = main_part
            product_name = main_part
        
        print(f"   👗 提取品牌: {brand}")
        print(f"   📝 提取标题: {product_name}")

        # ----- 价格 -----
        price = None
        # 方法1: 从 meta 标签获取
        meta_price = soup.find("meta", property="product:price:amount")
        if meta_price and meta_price.get("content"):
            try:
                price = float(meta_price["content"])
            except ValueError:
                pass
        
        # 方法2: 从 JSON-LD 结构化数据获取
        if price is None:
            json_ld_scripts = soup.find_all("script", type="application/ld+json")
            for script in json_ld_scripts:
                try:
                    data = json.loads(script.string)
                    if isinstance(data, dict) and "offers" in data:
                        offers = data["offers"]
                        if isinstance(offers, dict) and "price" in offers:
                            price = float(offers["price"])
                            break
                        elif isinstance(offers, list) and len(offers) > 0:
                            if "price" in offers[0]:
                                price = float(offers[0]["price"])
                                break
                except (json.JSONDecodeError, ValueError, KeyError):
                    continue
        
        # 方法3: 从 HTML 文本中解析
        if price is None:
            price = parse_price_from_html(html)
        
        if price is None or price <= 0:
            print("   ⚠️ 未能解析有效价格，跳过该商品")
            return None
        
        print(f"   💰 提取价格: ${price:.2f}")

        # ----- 图片 -----
        image_urls: List[str] = []
        # 方法1: 从 og:image meta 标签获取
        for meta_img in soup.find_all("meta", property="og:image"):
            src = meta_img.get("content")
            if src and src not in image_urls:
                # 确保是完整 URL
                if src.startswith("//"):
                    src = "https:" + src
                elif src.startswith("/"):
                    src = "https://www.farfetch.com" + src
                image_urls.append(src)
        
        # 方法2: 从图片标签获取（优先 farfetch-contents CDN）
        if not image_urls:
            for img in soup.find_all("img"):
                src = img.get("src") or img.get("data-src") or ""
                if src and ("farfetch-contents" in src or "farfetch" in src.lower()):
                    if src.startswith("//"):
                        src = "https:" + src
                    elif src.startswith("/"):
                        src = "https://www.farfetch.com" + src
                    if src not in image_urls:
                        image_urls.append(src)
        
        print(f"   🖼 提取图片: {len(image_urls)} 张")

        # ----- 描述 -----
        desc_parts: List[str] = []
        meta_desc = soup.find("meta", attrs={"name": "description"})
        if meta_desc and meta_desc.get("content"):
            desc_parts.append(meta_desc["content"].strip())

        highlights = extract_text_list_after_heading(soup, "Highlights")
        if highlights:
            desc_parts.append("Highlights: " + "; ".join(highlights))

        composition = extract_text_list_after_heading(soup, "Composition")
        if composition:
            desc_parts.append("Composition: " + "; ".join(composition))

        description = "\n".join(desc_parts) or f"{brand} {product_name} from Farfetch."

        # ----- Category -----
        category = guess_category_from_text(html)
        if category not in VALID_CATEGORIES:
            category = "Tops"

        # ----- Condition / Gender / Tags -----
        # 对于 Farfetch 上来的新品 wishlist，一般可以认为接近全新
        condition_str = "Like New"
        # 你的 URL 都是 /shopping/women/，这里直接用 Women
        gender_str = "Women"

        base_tags = [brand, *product_name.split()]
        tags = normalize_tags(base_tags)
        tags = add_special_brand_tags(brand, tags)

        material_str = "; ".join(composition) if composition else None

        listing_data: Dict[str, Any] = {
            # 必需字段
            "title": f"{brand} {product_name}",
            "description": description,
            "price": price,
            "category": category,
            "shippingOption": "Standard",

            # 可选字段
            "brand": brand,
            "size": None,  # 如需从页面抓尺寸可以再扩展
            "condition": condition_str,
            "material": material_str,
            "tags": tags,
            "gender": gender_str,
            "images": image_urls,
            "shippingFee": None,
            "location": None,
            "quantity": 1,
            "listed": True,
            "sold": False,
        }

        print(
            f"   🧾 解析完成: {listing_data['title'][:50]}... | "
            f"品牌={brand} | 价格=${price:.2f} | 分类={category}"
        )
        return listing_data

    # ---------- 高层封装：单个 URL ----------

    def create_listing_from_farfetch_url(self, url: str) -> Optional[Dict[str, Any]]:
        product = self.scrape_farfetch_product(url)
        if not product:
            return None
        return self.create_listing(product)

    # ---------- 高层封装：从文件批量处理 ----------

    def batch_create_from_farfetch_file(self, file_path: str) -> Tuple[int, List[str]]:
        if not os.path.exists(file_path):
            print(f"❌ URL 文件不存在: {file_path}")
            return 0, []

        urls: List[str] = []
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                u = line.strip()
                if u:
                    urls.append(u)

        if not urls:
            print("⚠️ 文件中没有任何 URL")
            return 0, []

        print(f"📦 共 {len(urls)} 个 Farfetch 商品链接待处理")

        success = 0
        failed: List[str] = []

        for idx, url in enumerate(urls, 1):
            print("\n" + "-" * 70)
            print(f"[{idx}/{len(urls)}] 处理: {url}")

            listing = self.create_listing_from_farfetch_url(url)
            if listing:
                success += 1
            else:
                failed.append(url)

            # 随机延迟 2-4 秒，模拟人类行为
            import random
            delay = random.uniform(2, 4)
            time.sleep(delay)

        return success, failed


