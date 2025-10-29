// 临时脚本：修复Adidas商品状态
// 使用方法：在移动端项目中运行这个脚本

const API_BASE_URL = 'http://192.168.0.79:3000';

// 你需要先获取你的认证token
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN_HERE'; // 替换为你的实际token

async function fixAdidasListing() {
  try {
    console.log('🔍 正在查找Adidas商品...');
    
    // 1. 先获取你的所有商品
    const response = await fetch(`${API_BASE_URL}/api/listings/my`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📋 你的商品列表:', data);
    
    // 2. 找到Adidas商品
    const adidasListings = data.listings?.filter(listing => 
      listing.brand && listing.brand.toLowerCase().includes('adidas')
    ) || [];
    
    console.log('👟 找到的Adidas商品:', adidasListings);
    
    if (adidasListings.length === 0) {
      console.log('❌ 没有找到Adidas商品');
      return;
    }
    
    // 3. 修改每个Adidas商品的状态
    for (const listing of adidasListings) {
      console.log(`🔄 正在修改商品: ${listing.title} (ID: ${listing.id})`);
      
      const updateResponse = await fetch(`${API_BASE_URL}/api/listings/${listing.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sold: false,
          listed: true
        })
      });
      
      if (updateResponse.ok) {
        console.log(`✅ 成功修改商品: ${listing.title}`);
      } else {
        console.error(`❌ 修改失败: ${listing.title}`, await updateResponse.text());
      }
    }
    
    console.log('🎉 所有Adidas商品状态修改完成！');
    
  } catch (error) {
    console.error('❌ 错误:', error);
  }
}

// 运行脚本
fixAdidasListing();



