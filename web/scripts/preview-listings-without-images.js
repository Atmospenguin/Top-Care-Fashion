#!/usr/bin/env node
/**
 * 预览无图片Listing工具（只读模式）
 *
 * 功能：仅查询和显示没有图片的listing，不执行删除操作
 *
 * 使用方法：
 *   node scripts/preview-listings-without-images.js
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

// 格式化日期显示
function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 格式化价格显示
function formatPrice(price) {
  if (!price) return '¥0.00';
  return `¥${Number(price).toFixed(2)}`;
}

// 检查图片字段是否为空
function hasNoImages(listing) {
  // 检查 image_url 是否为空
  if (listing.image_url) return false;

  // 检查 image_urls 是否为空
  if (!listing.image_urls) return true;

  // 如果 image_urls 是字符串，尝试解析
  let imageUrlsArray = [];
  if (typeof listing.image_urls === 'string') {
    try {
      imageUrlsArray = JSON.parse(listing.image_urls);
    } catch (e) {
      return true; // 解析失败，视为无图片
    }
  } else if (Array.isArray(listing.image_urls)) {
    imageUrlsArray = listing.image_urls;
  }

  // 检查数组是否为空或只包含空值
  return !imageUrlsArray || imageUrlsArray.length === 0 ||
         imageUrlsArray.every(url => !url || url.trim() === '');
}

async function main() {
  console.log('🔍 预览无图片Listing工具（只读模式）\n');
  console.log('━'.repeat(60));

  // 初始化Prisma客户端
  const prisma = new PrismaClient({
    log: ['error'],
  });

  try {
    // 1. 测试数据库连接
    console.log('📡 正在连接数据库...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ 数据库连接成功\n');

    // 2. 查询所有listing
    console.log('🔎 正在查询无图片的listing...');
    const allListings = await prisma.listings.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        brand: true,
        size: true,
        condition_type: true,
        image_url: true,
        image_urls: true,
        inventory_count: true,
        views_count: true,
        likes_count: true,
        sold: true,
        listed: true,
        created_at: true,
        seller_id: true,
        category: {
          select: {
            name: true
          }
        },
        seller: {
          select: {
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // 3. 过滤出没有图片的listing
    const listingsWithoutImages = allListings.filter(hasNoImages);

    console.log(`✅ 查询完成！找到 ${allListings.length} 个listing，其中 ${listingsWithoutImages.length} 个没有图片\n`);

    if (listingsWithoutImages.length === 0) {
      console.log('🎉 太好了！所有listing都有图片。');
      return;
    }

    // 4. 显示无图片listing的详细信息
    console.log('━'.repeat(60));
    console.log('📋 无图片Listing列表：\n');

    listingsWithoutImages.forEach((listing, index) => {
      console.log(`${index + 1}. ID: ${listing.id} | ${listing.name}`);
      console.log(`   价格: ${formatPrice(listing.price)} | 品牌: ${listing.brand || 'N/A'} | 尺码: ${listing.size || 'N/A'}`);
      console.log(`   分类: ${listing.category?.name || 'N/A'} | 状态: ${listing.condition_type}`);
      console.log(`   库存: ${listing.inventory_count || 0} | 浏览: ${listing.views_count || 0} | 点赞: ${listing.likes_count || 0}`);
      console.log(`   已售出: ${listing.sold ? '是' : '否'} | 已上架: ${listing.listed ? '是' : '否'}`);
      console.log(`   卖家: ${listing.seller?.username || 'N/A'} (ID: ${listing.seller_id || 'N/A'})`);
      console.log(`   创建时间: ${formatDate(listing.created_at)}`);

      // 显示图片字段的原始值
      console.log(`   image_url: ${listing.image_url || 'null'}`);
      console.log(`   image_urls: ${JSON.stringify(listing.image_urls) || 'null'}`);

      if (listing.description) {
        const shortDesc = listing.description.substring(0, 80);
        console.log(`   描述: ${shortDesc}${listing.description.length > 80 ? '...' : ''}`);
      }
      console.log('');
    });

    console.log('━'.repeat(60));

    // 5. 统计信息
    const stats = {
      total: listingsWithoutImages.length,
      sold: listingsWithoutImages.filter(l => l.sold).length,
      listed: listingsWithoutImages.filter(l => l.listed).length,
      unlisted: listingsWithoutImages.filter(l => !l.listed).length,
      totalValue: listingsWithoutImages.reduce((sum, l) => sum + Number(l.price || 0), 0),
      totalViews: listingsWithoutImages.reduce((sum, l) => sum + (l.views_count || 0), 0),
      totalLikes: listingsWithoutImages.reduce((sum, l) => sum + (l.likes_count || 0), 0),
    };

    console.log('\n📊 统计信息：');
    console.log(`   总计: ${stats.total} 个listing`);
    console.log(`   已售出: ${stats.sold} 个`);
    console.log(`   已上架: ${stats.listed} 个`);
    console.log(`   未上架: ${stats.unlisted} 个`);
    console.log(`   总价值: ${formatPrice(stats.totalValue)}`);
    console.log(`   总浏览量: ${stats.totalViews}`);
    console.log(`   总点赞数: ${stats.totalLikes}`);
    console.log('');
    console.log('━'.repeat(60));
    console.log('ℹ️  这是预览模式，不会删除任何数据。');
    console.log('💡 如需删除，请运行: node scripts/cleanup-listings-without-images.js');
    console.log('');

  } catch (error) {
    console.error('\n❌ 发生错误：');
    console.error(error.message);

    if (error.code) {
      console.error(`错误代码: ${error.code}`);
    }

    console.error('\n💡 故障排查建议：');
    console.error('   1. 检查数据库连接是否正常');
    console.error('   2. 确认 .env.local 文件中的 DATABASE_URL 配置正确');
    console.error('   3. 运行 node scripts/check-db-connection.js 测试连接');

    process.exit(1);
  } finally {
    // 关闭数据库连接
    await prisma.$disconnect();
  }
}

// 运行主函数
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
