# Farfetch 批量上传快速指南

## 📦 安装依赖

```bash
# 安装 Python 依赖
pip install -r scripts/requirements.txt

# 或者手动安装
pip install requests beautifulsoup4 lxml
```

## 🔑 设置认证

### 获取 Token

请查看 `GET_TOKEN.md` 了解如何获取你的认证 token。

### 设置环境变量

**PowerShell（Windows）：**
```powershell
$env:AUTH_TOKEN="your_jwt_token_here"
$env:API_BASE_URL="https://top-care-fashion.vercel.app"
```

**CMD（Windows）：**
```cmd
set AUTH_TOKEN=your_jwt_token_here
set API_BASE_URL=https://top-care-fashion.vercel.app
```

**Bash（Mac/Linux）：**
```bash
export AUTH_TOKEN="your_jwt_token_here"
export API_BASE_URL="https://top-care-fashion.vercel.app"
```

## 📝 准备 URL 文件

创建 `wishlist_urls.txt` 文件，每行一个 Farfetch URL：

```
https://www.farfetch.com/shopping/women/item-12345.aspx
https://www.farfetch.com/shopping/women/item-67890.aspx
https://www.farfetch.com/shopping/women/item-11111.aspx
```

## 🚀 运行批量上传

```bash
python scripts/farfetch_batch_upload.py wishlist_urls.txt
```

## ✨ 功能特性

### 自动数据抓取
- ✅ 从 Farfetch 页面自动提取商品信息
- ✅ 解析标题、品牌、价格、描述
- ✅ 提取商品图片
- ✅ 提取材质和成分信息

### 智能映射
- ✅ **分类识别**：根据商品描述自动识别分类
  - Tops（上装）
  - Bottoms（下装）
  - Footwear（鞋履）
  - Outerwear（外套）
  - Accessories（配饰）

- ✅ **特殊品牌标签**：自动为以下品牌添加标签
  - Vivienne Westwood → `designer`, `luxury`, `vintage`
  - Chanel → `designer`, `luxury`, `premium`
  - Gucci → `designer`, `luxury`, `premium`
  - Prada → `designer`, `luxury`
  - Louis Vuitton → `designer`, `luxury`, `premium`

- ✅ **Condition 映射**：自动设置为 "Like New"（Farfetch 新品）
- ✅ **Gender 映射**：从 URL 识别（/shopping/women/ → Women）

### 批量处理
- ✅ 支持批量处理多个 URL
- ✅ 显示处理进度 `[1/10]`, `[2/10]`...
- ✅ 自动延迟（1秒）避免请求过快
- ✅ 错误处理和失败 URL 记录

## 📊 输出示例

```
📦 共 3 个 Farfetch 商品链接待处理

----------------------------------------------------------------------
[1/3] 处理: https://www.farfetch.com/shopping/women/item-12345.aspx
🌐 抓取 Farfetch 商品: https://www.farfetch.com/shopping/women/item-12345.aspx
🧾 解析结果: title=Prada pleat-detail dress | brand=Prada | price=1299.0 | category=Tops
✅ Listing 创建成功: 456 | Prada pleat-detail dress

----------------------------------------------------------------------
[2/3] 处理: https://www.farfetch.com/shopping/women/item-67890.aspx
...

======================================================================
✅ 成功创建 3 个 listings
======================================================================
```

## ⚙️ 自定义配置

如果需要修改默认行为，可以编辑 `tcf_sdk/client.py`：

### 固定分类

在 `scrape_farfetch_product` 方法中，找到：
```python
category = guess_category_from_text(html)
```

改为：
```python
category = "Tops"  # 固定为 Tops
```

### 修改 Condition

找到：
```python
condition_str = "Like New"
```

改为：
```python
condition_str = "Brand New"  # 或其他值
```

### 添加更多特殊品牌

在文件顶部找到 `SPECIAL_BRANDS` 字典，添加：
```python
SPECIAL_BRANDS: Dict[str, List[str]] = {
    "Vivienne Westwood": ["designer", "luxury", "vintage"],
    "你的品牌": ["tag1", "tag2"],
    # ...
}
```

## 🐛 常见问题

### 1. 导入错误：`ModuleNotFoundError: No module named 'tcf_sdk'`

**解决：** 确保在项目根目录运行脚本，`tcf_sdk` 文件夹应该在项目根目录。

### 2. 认证失败：`401 Unauthorized`

**解决：** 
- 检查 `AUTH_TOKEN` 是否正确设置
- Token 可能已过期，重新登录获取新 token

### 3. 创建失败：`403 Forbidden`

**解决：**
- 可能达到 listing 数量限制（免费用户）
- 需要添加支付方式
- 升级到 Premium 账户

### 4. 价格解析失败：`⚠️ 未能解析有效价格`

**解决：**
- Farfetch 页面结构可能已变化
- 需要更新 `parse_price_from_html` 函数
- 可以手动在脚本中设置价格

### 5. 图片提取失败

**解决：**
- 检查网络连接
- Farfetch 可能更新了图片标签结构
- 可以手动在脚本中添加图片 URL

## 🔧 高级用法

### 单独使用 SDK

```python
from tcf_sdk import TCFClient

client = TCFClient(
    base_url="https://top-care-fashion.vercel.app",
    token="your_token"
)

# 单个 URL
listing = client.create_listing_from_farfetch_url(
    "https://www.farfetch.com/shopping/women/item-12345.aspx"
)

# 批量处理
success, failed = client.batch_create_from_farfetch_file("urls.txt")
```

### 只抓取不创建（测试用）

修改 `farfetch_batch_upload.py`，在 `create_listing_from_farfetch_url` 调用后添加：

```python
product = client.scrape_farfetch_product(url)
print(json.dumps(product, indent=2, ensure_ascii=False))
# 不调用 create_listing
```

## 📚 相关文档

- `LISTING_SCHEMA.md` - 完整的 Listing Schema 文档
- `listing_schema.json` - JSON Schema 格式
- `README.md` - 完整使用指南


