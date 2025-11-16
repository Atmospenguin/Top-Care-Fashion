#!/usr/bin/env python3
"""
测试 Top Care Fashion API 是否需要认证

这个脚本会测试：
1. 不带任何认证的请求
2. 带 Bearer token 的请求
3. 带 Cookie 的请求（如果提供）

用法：
    python scripts/test_api_auth.py
"""

import requests
import json
import os

API_BASE_URL = os.getenv("API_BASE_URL", "https://top-care-fashion.vercel.app")
AUTH_TOKEN = os.getenv("AUTH_TOKEN", "")

def test_without_auth():
    """测试不带任何认证的请求"""
    print("=" * 70)
    print("测试 1: 不带任何认证的请求")
    print("=" * 70)
    
    test_data = {
        "title": "Test Listing",
        "description": "This is a test listing",
        "price": 100.00,
        "category": "Tops",
        "shippingOption": "Standard",
    }
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/listings/create",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        
        if response.status_code == 200:
            print("✅ API 不需要认证！可以直接调用")
            return "NO_AUTH"
        elif response.status_code == 401:
            print("❌ API 需要认证（401 Unauthorized）")
            return "NEEDS_AUTH"
        elif response.status_code == 403:
            print("❌ API 需要认证（403 Forbidden）")
            return "NEEDS_AUTH"
        else:
            print(f"⚠️ 其他错误: {response.status_code}")
            return "UNKNOWN"
    except Exception as e:
        print(f"❌ 请求失败: {e}")
        return "ERROR"

def test_with_token():
    """测试带 Bearer token 的请求"""
    if not AUTH_TOKEN:
        print("\n" + "=" * 70)
        print("测试 2: 跳过（未设置 AUTH_TOKEN）")
        print("=" * 70)
        return "SKIPPED"
    
    print("\n" + "=" * 70)
    print("测试 2: 带 Bearer token 的请求")
    print("=" * 70)
    
    test_data = {
        "title": "Test Listing with Token",
        "description": "This is a test listing with token",
        "price": 100.00,
        "category": "Tops",
        "shippingOption": "Standard",
    }
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/listings/create",
            json=test_data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {AUTH_TOKEN}"
            },
            timeout=10
        )
        
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        
        if response.status_code == 200:
            print("✅ Token 认证成功！")
            return "TOKEN_WORKS"
        else:
            print(f"❌ Token 认证失败: {response.status_code}")
            return "TOKEN_FAILED"
    except Exception as e:
        print(f"❌ 请求失败: {e}")
        return "ERROR"

def test_with_cookie(cookie_string):
    """测试带 Cookie 的请求"""
    if not cookie_string:
        print("\n" + "=" * 70)
        print("测试 3: 跳过（未提供 Cookie）")
        print("=" * 70)
        print("\n💡 如何获取 Cookie：")
        print("   1. 在浏览器中登录 Top Care Fashion")
        print("   2. 打开 DevTools (F12)")
        print("   3. Application → Cookies → top-care-fashion.vercel.app")
        print("   4. 复制所有 cookie 值")
        return "SKIPPED"
    
    print("\n" + "=" * 70)
    print("测试 3: 带 Cookie 的请求")
    print("=" * 70)
    
    test_data = {
        "title": "Test Listing with Cookie",
        "description": "This is a test listing with cookie",
        "price": 100.00,
        "category": "Tops",
        "shippingOption": "Standard",
    }
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/listings/create",
            json=test_data,
            headers={
                "Content-Type": "application/json",
                "Cookie": cookie_string
            },
            timeout=10
        )
        
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        
        if response.status_code == 200:
            print("✅ Cookie 认证成功！")
            return "COOKIE_WORKS"
        else:
            print(f"❌ Cookie 认证失败: {response.status_code}")
            return "COOKIE_FAILED"
    except Exception as e:
        print(f"❌ 请求失败: {e}")
        return "ERROR"

def main():
    print("🔍 Top Care Fashion API 认证测试")
    print("=" * 70)
    print(f"API URL: {API_BASE_URL}")
    print(f"Token: {'已设置' if AUTH_TOKEN else '未设置'}")
    print()
    
    # 测试 1: 无认证
    result1 = test_without_auth()
    
    # 测试 2: Token 认证
    result2 = test_with_token()
    
    # 测试 3: Cookie 认证（从环境变量读取）
    cookie = os.getenv("API_COOKIE", "")
    result3 = test_with_cookie(cookie)
    
    # 总结
    print("\n" + "=" * 70)
    print("📊 测试总结")
    print("=" * 70)
    
    if result1 == "NO_AUTH":
        print("✅ 结论: API 不需要认证，可以直接调用")
        print("   你可以直接使用脚本，不需要设置 token 或 cookie")
    elif result2 == "TOKEN_WORKS":
        print("✅ 结论: API 使用 Bearer token 认证")
        print("   请确保设置了 AUTH_TOKEN 环境变量")
    elif result3 == "COOKIE_WORKS":
        print("✅ 结论: API 使用 Cookie 认证")
        print("   请设置 API_COOKIE 环境变量")
    else:
        print("⚠️ 结论: 需要进一步确认认证方式")
        print("   请检查：")
        print("   1. 浏览器 DevTools → Application → Cookies")
        print("   2. 浏览器 DevTools → Application → Local Storage")
        print("   3. 浏览器 DevTools → Network → 查看实际请求的 headers")

if __name__ == "__main__":
    main()

