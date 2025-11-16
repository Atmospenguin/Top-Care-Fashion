#!/usr/bin/env python3
"""
批量从 Farfetch 商品页面抓取数据并创建 Top Care Fashion Listings。

用法：
    # PowerShell (Windows):
    $env:AUTH_TOKEN="your_jwt_token"
    $env:API_BASE_URL="https://top-care-fashion.vercel.app"
    python scripts/farfetch_batch_upload.py wishlist_urls.txt
    
    # CMD (Windows):
    set AUTH_TOKEN=your_jwt_token
    set API_BASE_URL=https://top-care-fashion.vercel.app
    python scripts/farfetch_batch_upload.py wishlist_urls.txt
    
    # Bash (Mac/Linux):
    export AUTH_TOKEN="your_jwt_token"
    export API_BASE_URL="https://top-care-fashion.vercel.app"
    python scripts/farfetch_batch_upload.py wishlist_urls.txt
"""

import os
import sys
from tcf_sdk.client import TCFClient


def main():
    if len(sys.argv) < 2:
        print("用法: python scripts/farfetch_batch_upload.py wishlist_urls.txt")
        sys.exit(1)

    urls_file = sys.argv[1]
    if not os.path.exists(urls_file):
        print(f"❌ 找不到 URL 文件: {urls_file}")
        sys.exit(1)

    # 从环境变量读取配置（和你现有脚本保持一致）
    base_url = os.getenv("API_BASE_URL", "https://top-care-fashion.vercel.app")
    token = os.getenv("AUTH_TOKEN", "")
    cookie = os.getenv("API_COOKIE", "")

    # 检查是否有认证方式（token 或 cookie）
    if not token and not cookie:
        print("❌ 未设置认证信息")
        print("   请设置以下环境变量之一：")
        print("   方式 1 - Bearer Token:")
        print("      PowerShell: $env:AUTH_TOKEN='your_token_here'")
        print("      CMD:        set AUTH_TOKEN=your_token_here")
        print("   方式 2 - Cookie:")
        print("      PowerShell: $env:API_COOKIE='cookie_name=value; cookie_name2=value2'")
        print("      CMD:        set API_COOKIE=cookie_name=value; cookie_name2=value2")
        print()
        print("   如何获取认证信息？请查看:")
        print("   - scripts/GET_TOKEN.md (获取 Bearer token)")
        print("   - scripts/CHECK_AUTH.md (检查认证方式)")
        print()
        print("   或者运行测试脚本:")
        print("   python scripts/test_api_auth.py")
        sys.exit(1)

    client = TCFClient(base_url=base_url, token=token, cookie=cookie)
    
    if token:
        print("✅ 使用 Bearer token 认证")
    if cookie:
        print("✅ 使用 Cookie 认证")

    success, failed = client.batch_create_from_farfetch_file(urls_file)

    print("\n" + "=" * 70)
    print(f"✅ 成功创建 {success} 个 listings")
    if failed:
        print(f"❌ 失败 {len(failed)} 个，URL 列表：")
        for u in failed:
            print("   -", u)
    print("=" * 70)


if __name__ == "__main__":
    main()


