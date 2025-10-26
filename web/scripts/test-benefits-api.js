// 测试用户权益 API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function testBenefitsAPI() {
  console.log('🧪 测试用户权益 API...\n');

  // 你需要替换为一个真实的用户 JWT token
  const token = 'YOUR_JWT_TOKEN_HERE';

  if (token === 'YOUR_JWT_TOKEN_HERE') {
    console.log('❌ 请先设置一个真实的 JWT token');
    console.log('你可以从浏览器的 localStorage 或 API 响应中获取');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/user/benefits`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.log('❌ API 请求失败:');
      console.log('状态码:', response.status);
      console.log('响应:', JSON.stringify(data, null, 2));
      return;
    }

    console.log('✅ API 请求成功!\n');
    console.log('📊 用户信息:');
    console.log('  ID:', data.user.id);
    console.log('  用户名:', data.user.username);
    console.log('  是否付费:', data.user.isPremium ? '是 💎' : '否');
    if (data.user.premiumUntil) {
      console.log('  会员到期:', new Date(data.user.premiumUntil).toLocaleString('zh-CN'));
    }

    console.log('\n📈 权益详情:');
    console.log('  Listing 限制:', data.benefits.listingLimit || '无限制 ♾️');
    console.log('  已创建 Listings:', data.benefits.activeListingsCount);
    console.log('  剩余可创建:', data.benefits.remainingListings === null ? '无限制 ♾️' : data.benefits.remainingListings);
    console.log('  可以创建新 Listing:', data.benefits.canCreateListing ? '✅ 是' : '❌ 否');

    console.log('\n💰 佣金费率:');
    console.log('  当前费率:', (data.benefits.commissionRate * 100).toFixed(2) + '%');

    console.log('\n🎨 Mix & Match AI:');
    console.log('  使用限制:', data.benefits.mixMatchLimit || '无限制 ♾️');
    console.log('  已使用次数:', data.benefits.mixMatchUsedCount);
    console.log('  剩余次数:', data.benefits.remainingMixMatch === null ? '无限制 ♾️' : data.benefits.remainingMixMatch);
    console.log('  可以使用:', data.benefits.canUseMixMatch ? '✅ 是' : '❌ 否');

    console.log('\n📢 Promotion 价格:');
    console.log('  3天价格: $' + data.benefits.promotionPrice.toFixed(2));

    console.log('\n🎁 免费 Promotions (仅付费用户):');
    console.log('  每月限额:', data.benefits.freePromotionLimit || '无');
    console.log('  本月已用:', data.benefits.freePromotionsUsed);
    console.log('  本月剩余:', data.benefits.remainingFreePromotions === null ? '无限制 ♾️' : data.benefits.remainingFreePromotions);
    console.log('  可以使用:', data.benefits.canUseFreePromotion ? '✅ 是' : '❌ 否');
    if (data.benefits.freePromotionResetAt) {
      console.log('  重置时间:', new Date(data.benefits.freePromotionResetAt).toLocaleString('zh-CN'));
    }

  } catch (error) {
    console.log('❌ 请求出错:', error.message);
  }
}

testBenefitsAPI();
