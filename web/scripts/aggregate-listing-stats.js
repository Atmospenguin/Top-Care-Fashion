/**
 * 定时汇总脚本：每日汇总前一天的统计数据到 listing_stats_daily 表
 * 
 * 使用方法：
 * - 手动执行: node scripts/aggregate-listing-stats.js
 * - 定时任务: 设置cron每日执行（建议在凌晨2点执行）
 * 
 * 功能：
 * 1. 从 listing_clicks 表聚合前一天的点击数据
 * 2. 从 user_likes 表聚合前一天的点赞数据
 * 3. 从 views_count 增量计算前一天的查看数据（需要额外的视图追踪表或使用现有机制）
 * 4. 汇总到 listing_stats_daily 表
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function aggregateListingStats() {
  try {
    console.log('开始汇总listing统计数据...');

    // 计算日期范围：前一天（UTC时间）
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    yesterday.setUTCHours(0, 0, 0, 0);
    
    const today = new Date(yesterday);
    today.setUTCDate(today.getUTCDate() + 1);
    
    // 转换为Date对象（只保留日期部分）
    const yesterdayDate = new Date(Date.UTC(
      yesterday.getUTCFullYear(),
      yesterday.getUTCMonth(),
      yesterday.getUTCDate()
    ));

    console.log(`汇总日期范围: ${yesterday.toISOString()} 到 ${today.toISOString()}`);

    // 获取所有有活动的listings（有clicks或likes的）
    const activeListings = await prisma.listings.findMany({
      where: {
        OR: [
          {
            listing_clicks: {
              some: {
                clicked_at: {
                  gte: yesterday,
                  lt: today,
                },
              },
            },
          },
          {
            likes: {
              some: {
                created_at: {
                  gte: yesterday,
                  lt: today,
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
      },
    });

    console.log(`找到 ${activeListings.length} 个有活动的listings`);

    let processed = 0;
    let errors = 0;

    for (const listing of activeListings) {
      try {
        // 统计前一天的clicks
        const clicksCount = await prisma.listing_clicks.count({
          where: {
            listing_id: listing.id,
            clicked_at: {
              gte: yesterday,
              lt: today,
            },
          },
        });

        // 统计前一天的likes（新创建的likes）
        const likesCount = await prisma.user_likes.count({
          where: {
            listing_id: listing.id,
            created_at: {
              gte: yesterday,
              lt: today,
            },
          },
        });

        // 对于views，我们需要一个视图追踪机制
        // 由于当前没有专门的视图追踪表，我们可以：
        // 1. 使用listing_clicks作为代理（不准确）
        // 2. 或者创建一个视图追踪表
        // 3. 或者从views_count的增量计算（需要记录前一天的值）
        // 
        // 为了简化，这里我们暂时不统计views，或者使用clicks作为近似值
        // 实际应用中应该创建一个listing_views表来追踪视图
        
        // 注意：views的统计需要额外的视图追踪表
        // 这里我们暂时设为0，或者可以使用clicks作为近似值
        const viewsCount = 0; // TODO: 实现视图追踪后更新此值

        // 使用upsert更新或创建每日统计记录
        await prisma.listing_stats_daily.upsert({
          where: {
            listing_id_date: {
              listing_id: listing.id,
              date: yesterdayDate,
            },
          },
          update: {
            views: viewsCount,
            likes: likesCount,
            clicks: clicksCount,
            updated_at: new Date(),
          },
          create: {
            listing_id: listing.id,
            date: yesterdayDate,
            views: viewsCount,
            likes: likesCount,
            clicks: clicksCount,
          },
        });

        processed++;
      } catch (error) {
        console.error(`处理listing ${listing.id}时出错:`, error);
        errors++;
      }
    }

    console.log(`汇总完成！处理了 ${processed} 个listings，${errors} 个错误`);

    // 同时处理所有其他listings（即使没有活动，也要确保有记录）
    // 这样可以保持数据完整性
    const allListings = await prisma.listings.findMany({
      select: {
        id: true,
      },
    });

    for (const listing of allListings) {
      // 检查是否已有记录
      const existing = await prisma.listing_stats_daily.findUnique({
        where: {
          listing_id_date: {
            listing_id: listing.id,
            date: yesterdayDate,
          },
        },
      });

      // 如果没有记录且没有活动，创建零记录
      if (!existing) {
        try {
          await prisma.listing_stats_daily.create({
            data: {
              listing_id: listing.id,
              date: yesterdayDate,
              views: 0,
              likes: 0,
              clicks: 0,
            },
          });
        } catch (error) {
          // 忽略唯一约束错误（可能并发创建）
          if (error.code !== 'P2002') {
            console.error(`创建零记录时出错 (listing ${listing.id}):`, error);
          }
        }
      }
    }

    console.log('所有listings的统计记录已确保存在');
  } catch (error) {
    console.error('汇总统计数据时出错:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  aggregateListingStats()
    .then(() => {
      console.log('脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { aggregateListingStats };

