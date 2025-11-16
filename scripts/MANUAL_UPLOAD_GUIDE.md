# 手动上传指南（当自动抓取失败时）

如果 Farfetch 返回 403 错误（反爬虫保护），你可以手动输入商品信息来创建 listings。

## 方法 1：使用基础示例脚本手动输入

### 使用 `upload_listing_example.py`

1. **打开脚本文件**：`scripts/upload_listing_example.py`

2. **修改 `main()` 函数中的数据**：

```python
def main():
    # ... 前面的代码 ...
    
    # 手动输入商品信息
    listing_data = {
        "title": "Prada Pleat Detail Dress",  # 从 Farfetch 页面复制
        "description": "Prada pleat detail dress from Farfetch. Classic design with modern details.",  # 自己写描述
        "price": 1299.00,  # 从页面复制价格
        "category": "Tops",  # 根据商品类型选择
        "shippingOption": "Standard",
        
        "brand": "Prada",  # 从页面复制
        "size": None,  # 如果有尺寸信息
        "condition": "Like New",  # 通常是 "Like New" 或 "Brand New"
        "material": "Georgette",  # 从页面 Composition 部分复制
        "tags": ["designer", "luxury", "dress", "prada"],  # 自定义标签
        "gender": "Women",
        "images": [
            "https://cdn-images.farfetch-contents.com/prada-pleat-detail-dress_12345678_12345678_1000.jpg"  # 从页面复制图片 URL
        ],
        "shippingFee": 5.00,
        "quantity": 1,
    }
    
    result = create_listing(listing_data)
    # ... 后面的代码 ...
```

3. **运行脚本**：
```powershell
python scripts/upload_listing_example.py
```

## 方法 2：从 Farfetch 页面手动提取信息

### 步骤：

1. **打开 Farfetch 商品页面**（在浏览器中）

2. **提取以下信息**：

   - **标题**：页面顶部的商品名称
   - **品牌**：通常是标题的第一部分
   - **价格**：页面上的价格（可能需要转换货币）
   - **图片**：
     - 右键商品主图 → "复制图片地址"
     - 或查看页面源代码，搜索 `og:image` 或 `farfetch-contents`
   - **描述**：
     - 查看 "Description" 或 "Details" 部分
     - 查看 "Composition"（材质信息）
     - 查看 "Highlights"（亮点）
   - **分类**：根据商品类型判断
     - Dress → "Tops"
     - Jacket/Coat → "Outerwear"
     - Jeans/Pants → "Bottoms"
     - Shoes → "Footwear"
     - Bag/Accessories → "Accessories"

3. **使用 Python 脚本批量创建**：

创建一个新的脚本 `scripts/manual_batch_upload.py`：

```python
from tcf_sdk import TCFClient
import os

client = TCFClient(
    base_url=os.getenv("API_BASE_URL", "https://top-care-fashion.vercel.app"),
    token=os.getenv("AUTH_TOKEN", "")
)

# 手动输入的商品列表
listings = [
    {
        "title": "Prada Pleat Detail Dress",
        "description": "Prada pleat detail dress. Classic design with modern pleat details.",
        "price": 1299.00,
        "category": "Tops",
        "shippingOption": "Standard",
        "brand": "Prada",
        "condition": "Like New",
        "material": "Georgette",
        "tags": ["designer", "luxury", "dress"],
        "gender": "Women",
        "images": ["图片URL1", "图片URL2"],
        "quantity": 1,
    },
    {
        "title": "Gucci GG Supreme Mini Dress",
        "description": "Gucci GG Supreme mini dress with iconic logo print.",
        "price": 1500.00,
        "category": "Tops",
        "shippingOption": "Standard",
        "brand": "Gucci",
        "condition": "Like New",
        "tags": ["designer", "luxury", "premium", "dress"],
        "gender": "Women",
        "images": ["图片URL"],
        "quantity": 1,
    },
    # 添加更多商品...
]

success = 0
failed = []

for idx, listing_data in enumerate(listings, 1):
    print(f"\n[{idx}/{len(listings)}] 创建: {listing_data['title']}")
    result = client.create_listing(listing_data)
    if result:
        success += 1
    else:
        failed.append(listing_data['title'])

print(f"\n✅ 成功: {success}/{len(listings)}")
if failed:
    print(f"❌ 失败: {failed}")
```

## 方法 3：使用 CSV 文件批量导入

1. **创建 CSV 文件** `listings.csv`：

```csv
title,description,price,category,brand,condition,material,tags,gender,images
"Prada Pleat Detail Dress","Prada pleat detail dress",1299.00,Tops,Prada,"Like New",Georgette,"designer,luxury,dress",Women,"https://image1.jpg,https://image2.jpg"
"Gucci GG Supreme Mini Dress","Gucci GG Supreme mini dress",1500.00,Tops,Gucci,"Like New",,"designer,luxury,premium,dress",Women,"https://image1.jpg"
```

2. **创建导入脚本** `scripts/csv_import.py`：

```python
import csv
from tcf_sdk import TCFClient
import os

client = TCFClient(
    base_url=os.getenv("API_BASE_URL", "https://top-care-fashion.vercel.app"),
    token=os.getenv("AUTH_TOKEN", "")
)

with open('listings.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        listing_data = {
            "title": row['title'],
            "description": row['description'],
            "price": float(row['price']),
            "category": row['category'],
            "shippingOption": "Standard",
            "brand": row['brand'],
            "condition": row['condition'],
            "material": row.get('material') or None,
            "tags": row['tags'].split(',') if row.get('tags') else [],
            "gender": row['gender'],
            "images": row['images'].split(',') if row.get('images') else [],
            "quantity": 1,
        }
        
        print(f"创建: {listing_data['title']}")
        client.create_listing(listing_data)
```

## 方法 4：使用浏览器扩展提取数据

可以使用浏览器扩展（如 "Web Scraper" 或 "Data Miner"）从 Farfetch 页面提取数据，然后导出为 CSV 或 JSON，再使用上面的方法导入。

## 推荐工作流程

1. **在浏览器中打开每个 Farfetch 商品页面**
2. **复制以下信息到 Excel 或文本文件**：
   - 标题
   - 品牌
   - 价格
   - 图片 URL（右键图片 → 复制图片地址）
   - 描述/材质
3. **整理成 CSV 格式**
4. **使用 CSV 导入脚本批量创建**

这样可以避免反爬虫问题，同时保持批量处理的效率。

