// 直接测试 API 端点的实际响应
require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAPIEndpoint() {
  try {
    // 首先登录获取 token
    console.log('1️⃣ 登录获取 token...');
    const loginResponse = await fetch('http://192.168.0.80:3000/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'cathy@example.com',  // 使用 Cathy 的账号
        password: 'Password123!'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ 登录失败:', loginResponse.status);
      const error = await loginResponse.text();
      console.log('错误详情:', error);
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token || loginData.accessToken;
    
    if (!token) {
      console.log('❌ 未获取到 token');
      console.log('登录响应:', loginData);
      return;
    }

    console.log('✅ 登录成功，token:', token.substring(0, 20) + '...\n');

    // 测试获取 active listings
    console.log('2️⃣ 测试 GET /api/listings/my?status=active');
    const listingsResponse = await fetch('http://192.168.0.80:3000/api/listings/my?status=active', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!listingsResponse.ok) {
      console.log('❌ 请求失败:', listingsResponse.status);
      const error = await listingsResponse.text();
      console.log('错误详情:', error);
      return;
    }

    const listingsData = await listingsResponse.json();
    console.log('\n📦 返回的 listings:');
    console.log(`总数: ${listingsData.listings?.length || 0}\n`);

    if (listingsData.listings && listingsData.listings.length > 0) {
      listingsData.listings.forEach((listing, index) => {
        console.log(`${index + 1}. ${listing.title} (ID: ${listing.id})`);
        console.log(`   listed: ${listing.listed}, sold: ${listing.sold}`);
      });
    }

    // 检查是否包含已售出的商品
    const soldListings = (listingsData.listings || []).filter(l => l.sold === true);
    if (soldListings.length > 0) {
      console.log('\n⚠️  警告：Active listings 中包含已售出的商品:');
      soldListings.forEach(listing => {
        console.log(`   - ${listing.title} (ID: ${listing.id})`);
      });
    } else {
      console.log('\n✅ Active listings 中没有已售出的商品');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testAPIEndpoint();

