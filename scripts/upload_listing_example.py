#!/usr/bin/env python3
"""
上传 Listing 的示例脚本

这个脚本展示了如何通过 API 上传商品 listing 到 Top Care Fashion 平台。

使用方法：
1. 安装依赖：pip install requests
2. 设置环境变量或修改脚本中的配置
3. 运行脚本：python upload_listing_example.py
"""

import requests
import json
import os
from typing import Optional, List, Dict, Any

# ========== 配置 ==========
# API 基础 URL（根据你的环境修改）
API_BASE_URL = os.getenv("API_BASE_URL", "https://top-care-fashion.vercel.app")

# 你的认证 token（从登录后获取）
# 可以通过以下方式获取：
# 1. 登录后从浏览器开发者工具中获取
# 2. 使用登录 API 获取 token
AUTH_TOKEN = os.getenv("AUTH_TOKEN", "")

# ========== API 端点 ==========
CREATE_LISTING_ENDPOINT = f"{API_BASE_URL}/api/listings/create"
UPLOAD_IMAGE_ENDPOINT = f"{API_BASE_URL}/api/listings/upload-image"


def upload_listing_image(image_path: str) -> Optional[str]:
    """
    上传图片并返回图片 URL
    
    Args:
        image_path: 本地图片文件路径
        
    Returns:
        上传后的图片 URL，失败返回 None
    """
    if not os.path.exists(image_path):
        print(f"❌ 图片文件不存在: {image_path}")
        return None
    
    try:
        # 读取图片并转换为 base64
        with open(image_path, "rb") as f:
            image_data = f.read()
            import base64
            image_base64 = base64.b64encode(image_data).decode("utf-8")
        
        # 提取文件名
        filename = os.path.basename(image_path)
        
        # 准备请求数据
        payload = {
            "imageData": image_base64,
            "fileName": filename
        }
        
        # 发送请求
        headers = {
            "Authorization": f"Bearer {AUTH_TOKEN}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(
            UPLOAD_IMAGE_ENDPOINT,
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            image_url = data.get("imageUrl")
            if image_url:
                print(f"✅ 图片上传成功: {image_url}")
                return image_url
            else:
                print(f"❌ 响应中没有 imageUrl 字段")
                return None
        else:
            print(f"❌ 图片上传失败: HTTP {response.status_code}")
            print(f"   错误信息: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ 上传图片时出错: {str(e)}")
        return None


def create_listing(listing_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    创建 listing
    
    Args:
        listing_data: listing 数据字典
        
    Returns:
        创建成功的 listing 对象，失败返回 None
    """
    if not AUTH_TOKEN:
        print("❌ 错误: 未设置 AUTH_TOKEN")
        print("   请设置环境变量 AUTH_TOKEN 或在脚本中修改")
        return None
    
    # 验证必需字段
    required_fields = ["title", "description", "price", "category", "shippingOption"]
    missing_fields = [field for field in required_fields if not listing_data.get(field)]
    
    if missing_fields:
        print(f"❌ 缺少必需字段: {', '.join(missing_fields)}")
        return None
    
    try:
        headers = {
            "Authorization": f"Bearer {AUTH_TOKEN}",
            "Content-Type": "application/json"
        }
        
        print(f"📝 正在创建 listing: {listing_data.get('title')}")
        print(f"   发送到: {CREATE_LISTING_ENDPOINT}")
        
        response = requests.post(
            CREATE_LISTING_ENDPOINT,
            headers=headers,
            json=listing_data,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and data.get("data"):
                listing = data["data"]
                print(f"✅ Listing 创建成功!")
                print(f"   ID: {listing.get('id')}")
                print(f"   标题: {listing.get('title')}")
                print(f"   价格: ${listing.get('price')}")
                return listing
            else:
                print(f"❌ 响应格式错误: {data}")
                return None
        elif response.status_code == 401:
            print("❌ 认证失败: Token 无效或已过期")
            print("   请重新登录获取新的 token")
            return None
        elif response.status_code == 403:
            error_data = response.json()
            print(f"❌ 创建失败: {error_data.get('message', 'Listing limit reached')}")
            return None
        else:
            print(f"❌ 创建失败: HTTP {response.status_code}")
            try:
                error_data = response.json()
                print(f"   错误信息: {error_data.get('error', response.text)}")
            except:
                print(f"   错误信息: {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ 网络请求错误: {str(e)}")
        return None
    except Exception as e:
        print(f"❌ 创建 listing 时出错: {str(e)}")
        return None


def main():
    """
    主函数：示例用法
    """
    print("=" * 60)
    print("Top Care Fashion - Listing 上传脚本示例")
    print("=" * 60)
    print()
    
    # 检查 token
    if not AUTH_TOKEN:
        print("⚠️  警告: 未设置 AUTH_TOKEN")
        print("   请先设置环境变量或在脚本中修改 AUTH_TOKEN")
        print()
        print("   获取 token 的方法：")
        print("   1. 登录后从浏览器开发者工具 Network 标签中获取")
        print("   2. 使用登录 API 获取 token")
        print()
        return
    
    # ========== 示例 1: 上传图片 ==========
    print("📸 示例 1: 上传图片")
    print("-" * 60)
    
    # 如果你有本地图片，可以上传
    # image_url = upload_listing_image("path/to/your/image.jpg")
    # 如果没有图片，可以使用已有的图片 URL
    image_urls = [
        "https://example.com/image1.jpg",  # 替换为实际的图片 URL
        "https://example.com/image2.jpg",
    ]
    
    print(f"使用图片 URLs: {image_urls}")
    print()
    
    # ========== 示例 2: 创建 listing ==========
    print("📝 示例 2: 创建 listing")
    print("-" * 60)
    
    # 构建 listing 数据
    listing_data = {
        # 必需字段
        "title": "示例商品标题",
        "description": "这是一个示例商品描述。可以包含商品的详细信息、使用情况等。",
        "price": 99.99,
        "category": "Tops",  # 可选值: "Accessories", "Bottoms", "Footwear", "Outerwear", "Tops"
        "shippingOption": "Standard",  # 可选值: "Standard", "Express", "Meet-up"
        
        # 可选字段
        "brand": "示例品牌",
        "size": "M",  # 例如: "S", "M", "L", "XL", "38", "39", "N/A" 等
        "condition": "Good",  # 可选值: "Brand New", "Like New", "Good", "Fair", "Poor"
        "material": "Cotton",
        "tags": ["vintage", "casual", "summer"],
        "gender": "Unisex",  # 可选值: "Men", "Women", "Unisex"
        "images": image_urls,  # 图片 URL 数组
        "shippingFee": 5.00,  # 运费（可选）
        "location": "New York, NY",  # 如果是 Meet-up，需要提供位置
        "quantity": 1,  # 库存数量，默认为 1
    }
    
    # 创建 listing
    result = create_listing(listing_data)
    
    if result:
        print()
        print("=" * 60)
        print("✅ 成功!")
        print("=" * 60)
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print()
        print("=" * 60)
        print("❌ 失败!")
        print("=" * 60)


# ========== 批量上传示例 ==========
def batch_upload_listings(listings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    批量上传多个 listings
    
    Args:
        listings: listing 数据列表
        
    Returns:
        成功创建的 listing 列表
    """
    results = []
    
    for i, listing_data in enumerate(listings, 1):
        print(f"\n[{i}/{len(listings)}] 处理 listing...")
        result = create_listing(listing_data)
        if result:
            results.append(result)
        # 可以添加延迟以避免请求过快
        import time
        time.sleep(1)
    
    print(f"\n✅ 成功创建 {len(results)}/{len(listings)} 个 listings")
    return results


if __name__ == "__main__":
    main()


