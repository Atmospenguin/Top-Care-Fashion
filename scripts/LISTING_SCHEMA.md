# Listing Schema 完整文档

本文档详细说明了 Top Care Fashion 平台中 Listing（商品）的完整数据结构、枚举值和约束条件。

## 📋 目录

1. [数据库 Schema](#数据库-schema)
2. [枚举值定义](#枚举值定义)
3. [API 请求格式](#api-请求格式)
4. [字段映射规则](#字段映射规则)
5. [特殊处理逻辑](#特殊处理逻辑)

---

## 数据库 Schema

### `listings` 表结构（完整数据库字段）

> **注意：** 以下字段分为三类：
> - ✅ **API 可设置** - 可以通过 API 创建/更新
> - 🔒 **只读字段** - 系统自动维护，API 不支持设置
> - 📝 **数据库存在但 API 暂不支持** - 未来可能支持

| 字段名 | 类型 | 约束 | 默认值 | API 支持 | 说明 |
|--------|------|------|--------|---------|------|
| `id` | Int | PK, Auto | - | 🔒 只读 | Listing ID（自动生成） |
| `name` | String(120) | NOT NULL | - | ✅ 可设置 | 商品标题（API 字段：`title`） |
| `description` | String? | - | null | ✅ 可设置 | 商品描述 |
| `category_id` | Int? | FK → listing_categories.id | null | ✅ 可设置 | 分类 ID（API 通过 `category` 名称解析） |
| `seller_id` | Int? | FK → users.id | null | 🔒 只读 | 卖家 ID（从认证 token 自动获取） |
| `listed` | Boolean | - | true | ✅ 可设置 | 是否已上架 |
| `sold` | Boolean | - | false | ✅ 可设置 | 是否已售出 |
| `price` | Decimal(10, 2) | NOT NULL | - | ✅ 可设置 | 价格 |
| `image_url` | String? | - | null | ❌ 已废弃 | 单张图片 URL（已废弃，使用 `image_urls`） |
| `image_urls` | Json? | - | null | ✅ 可设置 | 图片 URL 数组（API 字段：`images`） |
| `brand` | String(100)? | - | null | ✅ 可设置 | 品牌名称 |
| `size` | String(50)? | - | null | ✅ 可设置 | 尺码 |
| `condition_type` | ConditionType | - | GOOD | ✅ 可设置 | 商品状况（API 字段：`condition`） |
| `tags` | Json? | - | null | ✅ 可设置 | 标签数组（JSON 格式） |
| `material` | String(100)? | - | null | ✅ 可设置 | 材质 |
| `gender` | Gender? | - | Unisex | ✅ 可设置 | 性别（枚举） |
| `shipping_option` | String(50)? | - | null | ✅ 可设置 | 配送方式（API 字段：`shippingOption`） |
| `shipping_fee` | Decimal(10, 2)? | - | null | ✅ 可设置 | 运费（API 字段：`shippingFee`） |
| `location` | String(100)? | - | null | ✅ 可设置 | 位置（Meet-up 时需要） |
| `inventory_count` | Int? | - | 1 | ✅ 可设置 | 库存数量（API 字段：`quantity`） |
| `created_at` | DateTime | - | now() | 🔒 只读 | 创建时间（系统自动设置） |
| `updated_at` | DateTime? | - | now() | 🔒 只读 | 更新时间（系统自动更新） |
| `sold_at` | DateTime? | - | null | 🔒 只读 | 售出时间（系统自动设置） |
| `original_price` | Decimal(10, 2)? | - | null | 📝 暂不支持 | 原价（数据库有但 API 暂不支持） |
| `weight` | Decimal(8, 2)? | - | null | 📝 暂不支持 | 重量（数据库有但 API 暂不支持） |
| `dimensions` | String(50)? | - | null | 📝 暂不支持 | 尺寸（数据库有但 API 暂不支持） |
| `sku` | String(50)? | - | null | 📝 暂不支持 | SKU（数据库有但 API 暂不支持） |
| `views_count` | Int? | - | 0 | 🔒 只读 | 浏览次数（系统自动维护） |
| `likes_count` | Int? | - | 0 | 🔒 只读 | 点赞数（系统自动维护） |
| `clicks_count` | Int | - | 0 | 🔒 只读 | 点击次数（系统自动维护） |

---

## 枚举值定义

### 1. ConditionType（商品状况）

**数据库枚举值：**
- `NEW` - 全新
- `LIKE_NEW` - 近新
- `GOOD` - 良好
- `FAIR` - 一般
- `POOR` - 较差

**API 接受的字符串值（会自动映射）：**
```javascript
{
  "Brand New": "NEW",
  "New": "NEW",
  "Like New": "LIKE_NEW",
  "Like new": "LIKE_NEW",
  "like new": "LIKE_NEW",
  "Good": "GOOD",
  "good": "GOOD",
  "Fair": "FAIR",
  "fair": "FAIR",
  "Poor": "POOR",
  "poor": "POOR"
}
```

**默认值：** `GOOD`

---

### 2. Gender（性别）

**数据库枚举值：**
- `Men` - 男
- `Women` - 女
- `Unisex` - 中性

**API 接受的字符串值（会自动映射）：**
```javascript
{
  "men": "Men",
  "male": "Men",
  "women": "Women",
  "female": "Women",
  "unisex": "Unisex",
  "uni": "Unisex",
  "all": "Unisex"
}
```

**默认值：** `Unisex`

---

### 3. ListingCategory（商品分类）

**有效的分类名称：**
- `"Accessories"` - 配饰
- `"Bottoms"` - 下装
- `"Footwear"` - 鞋履
- `"Outerwear"` - 外套
- `"Tops"` - 上装

**注意：**
- 分类通过 `resolveCategoryId()` 函数解析为 `category_id`
- 支持模糊匹配（如 "top" 可以匹配 "Tops"）
- 分类存储在 `listing_categories` 表中，通过名称查找 ID

---

### 4. ShippingOption（配送方式）

**有效值：**
- `"Standard"` - 标准配送
- `"Express"` - 快速配送
- `"Meet-up"` - 面交（需要提供 `location`）

---

## API 请求格式

### 创建 Listing 请求

**端点：** `POST /api/listings/create`

**认证：** 需要在 Header 中提供 Bearer Token
```
Authorization: Bearer <your_jwt_token>
```

### 请求体结构

```typescript
interface CreateListingRequest {
  // ========== 必需字段 ==========
  title: string;              // 商品标题 (1-120 字符)
  description: string;        // 商品描述
  price: number;              // 价格 (必须 > 0)
  category: string;           // 分类名称: "Accessories" | "Bottoms" | "Footwear" | "Outerwear" | "Tops"
  shippingOption: string;      // 配送方式: "Standard" | "Express" | "Meet-up"
  
  // ========== 可选字段 ==========
  brand?: string | null;      // 品牌名称 (最大 100 字符)
  size?: string | null;       // 尺码 (最大 50 字符)
  condition?: string;         // 商品状况: "Brand New" | "Like New" | "Good" | "Fair" | "Poor"
  material?: string | null;    // 材质 (最大 100 字符)
  tags?: string[];            // 标签数组
  gender?: string;            // 性别: "Men" | "Women" | "Unisex"
  images?: string[];          // 图片 URL 数组
  shippingFee?: number | null; // 运费
  location?: string | null;    // 位置 (Meet-up 时需要，最大 100 字符)
  quantity?: number;           // 库存数量 (默认 1，最小 1)
  listed?: boolean;            // 是否上架 (默认 true)
  sold?: boolean;             // 是否售出 (默认 false)
}
```

### 示例请求

```json
{
  "title": "Vivienne Westwood 经典格纹衬衫",
  "description": "经典格纹设计，100% 纯棉材质，适合日常穿搭。",
  "price": 299.99,
  "category": "Tops",
  "shippingOption": "Standard",
  "brand": "Vivienne Westwood",
  "size": "M",
  "condition": "Like New",
  "material": "Cotton",
  "tags": ["vintage", "designer", "classic", "plaid"],
  "gender": "Unisex",
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "shippingFee": 5.00,
  "quantity": 1
}
```

---

## 字段映射规则

### 1. Title → Name
- API 字段：`title`
- 数据库字段：`name`
- 映射：直接对应

### 2. Category → Category ID
- API 字段：`category` (字符串名称)
- 数据库字段：`category_id` (整数 ID)
- 映射：通过 `resolveCategoryId()` 函数解析

### 3. Condition → ConditionType
- API 字段：`condition` (字符串)
- 数据库字段：`condition_type` (枚举)
- 映射：使用 `mapConditionToEnum()` 函数

### 4. Quantity → Inventory Count
- API 字段：`quantity`
- 数据库字段：`inventory_count`
- 映射：直接对应

### 5. Images → Image URLs
- API 字段：`images` (字符串数组)
- 数据库字段：`image_urls` (JSON 数组)
- 映射：数组转 JSON

---

## 特殊处理逻辑

### 1. 品牌特殊标签处理

某些品牌需要添加特殊标签，建议在脚本中实现：

```python
# 特殊品牌列表
SPECIAL_BRANDS = {
    "Vivienne Westwood": ["designer", "luxury", "vintage"],
    "Chanel": ["designer", "luxury", "premium"],
    "Gucci": ["designer", "luxury", "premium"],
    "Prada": ["designer", "luxury"],
    # 添加更多品牌...
}

def add_special_tags(brand: str, existing_tags: list) -> list:
    """为特殊品牌添加标签"""
    if brand in SPECIAL_BRANDS:
        tags = existing_tags.copy() if existing_tags else []
        for tag in SPECIAL_BRANDS[brand]:
            if tag not in tags:
                tags.append(tag)
        return tags
    return existing_tags or []
```

### 2. 固定分类处理

如果需要固定某个分类，可以在脚本中设置：

```python
# 固定分类
FIXED_CATEGORY = "Tops"  # 或 "Accessories", "Bottoms", "Footwear", "Outerwear"

# 在创建 listing 时使用
listing_data = {
    "category": FIXED_CATEGORY,
    # ... 其他字段
}
```

### 3. 标签规范化

建议对标签进行规范化处理：

```python
def normalize_tags(tags: list) -> list:
    """规范化标签"""
    normalized = []
    for tag in tags:
        if tag:
            # 转换为小写，去除空格
            normalized_tag = tag.lower().strip()
            if normalized_tag and normalized_tag not in normalized:
                normalized.append(normalized_tag)
    return normalized
```

### 4. 尺码处理

尺码字段支持多种格式：
- 字母尺码：`"S"`, `"M"`, `"L"`, `"XL"`, `"XXL"` 等
- 数字尺码：`"38"`, `"39"`, `"40"` 等（鞋子）
- 组合尺码：`"M / EU 38 / UK 10 / US 6"`
- 特殊值：`"N/A"`, `"One Size"`, `"Free Size"`

**注意：** 系统会自动提取主要尺码（如组合尺码中的第一个部分）

### 5. 图片上传

图片需要先上传到服务器获取 URL：

**上传端点：** `POST /api/listings/upload-image`

**请求格式：**
```json
{
  "imageData": "<base64_encoded_image>",
  "fileName": "image.jpg"
}
```

**响应格式：**
```json
{
  "imageUrl": "https://example.com/uploaded/image.jpg"
}
```

---

## 验证规则

### 必需字段验证
- `title`: 不能为空，最大 120 字符
- `description`: 不能为空
- `price`: 必须是数字，且 > 0
- `category`: 必须是有效的分类名称
- `shippingOption`: 必须是 "Standard" | "Express" | "Meet-up"

### 可选字段验证
- `quantity`: 如果提供，必须是 >= 1 的整数
- `shippingFee`: 如果提供，必须是数字
- `location`: 如果 `shippingOption` 是 "Meet-up"，建议提供
- `images`: 数组，每个元素必须是有效的 URL 字符串

### 业务规则
1. **Listing 数量限制：**
   - 免费用户有 listing 数量限制
   - Premium 用户无限制
   - 达到限制时返回 403 错误

2. **支付方式要求：**
   - 用户必须至少有一个支付方式才能创建 listing
   - 缺少支付方式时返回 400 错误

3. **库存数量：**
   - 默认值为 1
   - 最小值为 1
   - 不能为负数或 0

---

## 错误响应

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```
**原因：** Token 无效或已过期

### 400 Bad Request
```json
{
  "error": "Missing required fields: title, description, price, category, shippingOption"
}
```
**原因：** 缺少必需字段或字段格式错误

### 403 Forbidden
```json
{
  "error": "Listing limit reached",
  "message": "Free users can only have X active listings. Upgrade to Premium for unlimited listings.",
  "limit": 10,
  "current": 10
}
```
**原因：** 达到 listing 数量限制

### 400 Bad Request (支付方式)
```json
{
  "error": "Missing payout method",
  "message": "Add a payout method in Manage Payments before posting a listing."
}
```
**原因：** 缺少支付方式

---

## 成功响应

### 创建成功
```json
{
  "success": true,
  "data": {
    "id": "123",
    "title": "商品标题",
    "description": "商品描述",
    "price": 99.99,
    "brand": "品牌名称",
    "size": "M",
    "condition": "GOOD",
    "material": "Cotton",
    "tags": ["tag1", "tag2"],
    "category": "Tops",
    "images": ["https://example.com/image.jpg"],
    "shippingOption": "Standard",
    "shippingFee": 5.00,
    "location": null,
    "likesCount": 0,
    "availableQuantity": 1,
    "gender": "Unisex",
    "seller": {
      "name": "卖家用户名",
      "avatar": "https://example.com/avatar.jpg",
      "rating": 4.5,
      "sales": 10
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## 完整示例脚本模板

```python
# 完整的 listing 数据结构示例
listing_data = {
    # 必需字段
    "title": "商品标题（1-120 字符）",
    "description": "商品详细描述",
    "price": 99.99,  # 数字，必须 > 0
    "category": "Tops",  # 必须是: "Accessories" | "Bottoms" | "Footwear" | "Outerwear" | "Tops"
    "shippingOption": "Standard",  # 必须是: "Standard" | "Express" | "Meet-up"
    
    # 可选字段
    "brand": "品牌名称",  # 最大 100 字符
    "size": "M",  # 最大 50 字符，支持多种格式
    "condition": "Good",  # "Brand New" | "Like New" | "Good" | "Fair" | "Poor"
    "material": "Cotton",  # 最大 100 字符
    "tags": ["tag1", "tag2", "tag3"],  # 字符串数组
    "gender": "Unisex",  # "Men" | "Women" | "Unisex"
    "images": [  # 图片 URL 数组
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg"
    ],
    "shippingFee": 5.00,  # 数字，可选
    "location": "New York, NY",  # 最大 100 字符，Meet-up 时建议提供
    "quantity": 1,  # 整数，最小 1，默认 1
}
```

---

## 注意事项

### 1. 字段分类说明

**✅ API 可设置的字段：**
- 这些字段可以通过 `POST /api/listings/create` 设置
- 包括：title, description, price, category, shippingOption, brand, size, condition, material, tags, gender, images, shippingFee, location, quantity, listed, sold

**🔒 只读字段（系统自动维护）：**
- `id` - 自动生成
- `seller_id` - 从认证 token 获取
- `created_at` - 创建时自动设置
- `updated_at` - 更新时自动更新
- `sold_at` - 售出时自动设置
- `views_count` - 系统自动统计
- `likes_count` - 系统自动统计
- `clicks_count` - 系统自动统计

**📝 数据库存在但 API 暂不支持：**
- `original_price` - 原价（未来可能支持）
- `weight` - 重量（未来可能支持）
- `dimensions` - 尺寸（未来可能支持）
- `sku` - SKU（未来可能支持）

### 2. 字段长度限制

| 字段 | 最大长度 | 数据库类型 |
|------|---------|-----------|
| `title` | 120 字符 | VarChar(120) |
| `brand` | 100 字符 | VarChar(100) |
| `size` | 50 字符 | VarChar(50) |
| `material` | 100 字符 | VarChar(100) |
| `location` | 100 字符 | VarChar(100) |
| `shipping_option` | 50 字符 | VarChar(50) |

### 3. 数据类型

- `price`: Decimal(10, 2) - 最多 10 位数字，2 位小数
- `shippingFee`: Decimal(10, 2) - 最多 10 位数字，2 位小数
- `quantity`: Int - 整数，最小 1，默认 1

### 4. JSON 字段

- `image_urls`: JSON 数组格式 `["url1", "url2"]`
- `tags`: JSON 数组格式 `["tag1", "tag2"]`

### 5. 默认值

| 字段 | 默认值 |
|------|--------|
| `condition_type` | `GOOD` |
| `gender` | `Unisex` |
| `listed` | `true` |
| `sold` | `false` |
| `inventory_count` | `1` |
| `views_count` | `0` |
| `likes_count` | `0` |
| `clicks_count` | `0` |

### 6. 特殊处理规则

- **空字符串处理：** 空字符串会被转换为 `null`
- **占位符过滤：** 占位符字符串（如 "select", "none", "notavailable"）会被过滤为 `null`
- **分类解析：** 分类名称通过 `resolveCategoryId()` 函数解析，支持模糊匹配
- **条件映射：** condition 字符串通过 `mapConditionToEnum()` 映射到枚举值
- **性别映射：** gender 字符串通过 `resolveGender()` 映射到枚举值

---

## 总结

使用此 schema 文档，你可以：
1. 了解所有字段的完整定义
2. 知道哪些字段是必需的，哪些是可选的
3. 理解枚举值的映射规则
4. 实现特殊品牌标签处理
5. 正确处理错误响应
6. 生成符合项目规范的脚本

将此文档提供给 ChatGPT 或其他 AI 工具，它们就能生成完全符合你项目规范的 listing 上传脚本。

