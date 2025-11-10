import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserStatus, OrderStatus } from "@prisma/client";
import { summarizeOrderTotals } from "@/lib/admin-orders";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    // Calculate date ranges
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get user stats
    const [totalUsers, activeUsers, premiumUsers, newUsersThisWeek] = await Promise.all([
      prisma.users.count(),
      prisma.users.count({ where: { status: UserStatus.ACTIVE } }),
      prisma.users.count({ where: { is_premium: true } }),
      prisma.users.count({ where: { created_at: { gte: startOfWeek } } }),
    ]);

    // Get listing stats
    const [totalListings, activeListings, soldListings, newListingsThisWeek] = await Promise.all([
      prisma.listings.count(),
      prisma.listings.count({ where: { listed: true, sold: false } }),
      prisma.listings.count({ where: { sold: true } }),
      prisma.listings.count({ where: { created_at: { gte: startOfWeek } } }),
    ]);

    // Get transaction stats
    const [allTransactions, completedTransactions, transactionsThisWeek] = await Promise.all([
      prisma.orders.findMany({
        select: {
          id: true,
          status: true,
          created_at: true,
          total_amount: true,
          commission_rate: true,
          commission_amount: true,
          listing: {
            select: {
              price: true,
            },
          },
        },
      }),
      prisma.orders.count({
        where: {
          status: {
            in: [OrderStatus.COMPLETED, OrderStatus.REVIEWED, OrderStatus.RECEIVED],
          },
        },
      }),
      prisma.orders.count({ where: { created_at: { gte: startOfWeek } } }),
    ]);

    // Calculate revenue
    const completedStatusList = [OrderStatus.COMPLETED, OrderStatus.REVIEWED, OrderStatus.RECEIVED];
    const completedOrders = allTransactions.filter((t) =>
      completedStatusList.some((status) => status === t.status)
    );

    const totalRevenue = completedOrders.reduce((sum, order) => {
      const { totalAmount } = summarizeOrderTotals(order);
      return sum + totalAmount;
    }, 0);

    const revenueThisMonth = completedOrders
      .filter((t) => new Date(t.created_at) >= startOfMonth)
      .reduce((sum, order) => {
        const { totalAmount } = summarizeOrderTotals(order);
        return sum + totalAmount;
      }, 0);

    const totalCommissionRevenue = completedOrders.reduce((sum, order) => {
      const commissionAmount = order.commission_amount ? Number(order.commission_amount) : 0;
      return sum + commissionAmount;
    }, 0);

    const commissionRevenueThisMonth = completedOrders
      .filter((t) => new Date(t.created_at) >= startOfMonth)
      .reduce((sum, order) => {
        const commissionAmount = order.commission_amount ? Number(order.commission_amount) : 0;
        return sum + commissionAmount;
      }, 0);

    // Get top items by views
    const topItemsRaw = await prisma.listings.findMany({
      select: {
        id: true,
        name: true,
        views_count: true,
        likes_count: true,
        clicks_count: true,
      },
      orderBy: {
        views_count: "desc",
      },
      take: 5,
    });

    // Get bag counts for each top item
    const topItems = await Promise.all(
      topItemsRaw.map(async (item) => {
        const bagCount = await prisma.cart_items.count({
          where: {
            listing_id: item.id,
            quantity: {
              gt: 0,
            },
          },
        });
        return {
          ...item,
          bag_count: bagCount,
        };
      })
    );

    // Get top sellers
    const topSellersData = await prisma.orders.groupBy({
      by: ["seller_id"],
      where: {
        status: {
          in: [OrderStatus.COMPLETED, OrderStatus.REVIEWED, OrderStatus.RECEIVED],
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 5,
    });

    const topSellers = await Promise.all(
      topSellersData.map(async (seller) => {
        const user = await prisma.users.findUnique({
          where: { id: seller.seller_id },
          select: {
            id: true,
            username: true,
            average_rating: true,
          },
        });

        const orders = await prisma.orders.findMany({
          where: {
            seller_id: seller.seller_id,
            status: {
              in: [OrderStatus.COMPLETED, OrderStatus.REVIEWED, OrderStatus.RECEIVED],
            },
          },
          include: {
            listing: {
              select: {
                price: true,
              },
            },
          },
        });

        const revenue = orders.reduce((sum, order) => {
          return sum + (order.listing?.price ? Number(order.listing.price) : 0);
        }, 0);

        return {
          id: String(seller.seller_id),
          username: user?.username || `User ${seller.seller_id}`,
          totalSales: seller._count.id,
          revenue,
          rating: user?.average_rating ? Number(user.average_rating) : null,
        };
      })
    );

    // Get recent transactions
    const recentOrders = await prisma.orders.findMany({
      take: 10,
      orderBy: { created_at: "desc" },
      include: {
        buyer: { select: { username: true } },
        seller: { select: { username: true } },
        listing: { select: { name: true, price: true } },
      },
    });

    const recentTransactions = recentOrders.map((order) => ({
      id: String(order.id),
      buyerName: order.buyer?.username || `User ${order.buyer_id}`,
      sellerName: order.seller?.username || `User ${order.seller_id}`,
      listingName: order.listing?.name || `Listing ${order.listing_id}`,
      amount: order.listing?.price ? Number(order.listing.price) : 0,
      status: order.status.toLowerCase(),
      createdAt: order.created_at.toISOString(),
    }));

    // Get promotion stats
    const [
      totalPromotions,
      activePromotions,
      expiredPromotions,
      promotionsThisWeek,
    ] = await Promise.all([
      prisma.listing_promotions.count(),
      prisma.listing_promotions.count({
        where: {
          status: "ACTIVE",
          ends_at: { gt: now },
        },
      }),
      prisma.listing_promotions.count({
        where: { status: "EXPIRED" },
      }),
      prisma.listing_promotions.count({
        where: { created_at: { gte: startOfWeek } },
      }),
    ]);

    // Calculate boost revenue from paid_amount field
    const boostRevenueStats = await prisma.listing_promotions.aggregate({
      _sum: {
        paid_amount: true,
      },
      _count: {
        id: true,
      },
      where: {
        paid_amount: { gt: 0 },
      },
    });

    const boostRevenueThisMonthStats = await prisma.listing_promotions.aggregate({
      _sum: {
        paid_amount: true,
      },
      _count: {
        id: true,
      },
      where: {
        paid_amount: { gt: 0 },
        created_at: { gte: startOfMonth },
      },
    });

    const totalBoostRevenue = boostRevenueStats._sum.paid_amount
      ? Number(boostRevenueStats._sum.paid_amount)
      : 0;
    const paidPromotionsTotal = boostRevenueStats._count.id;

    const boostRevenueThisMonth = boostRevenueThisMonthStats._sum.paid_amount
      ? Number(boostRevenueThisMonthStats._sum.paid_amount)
      : 0;
    const paidPromotionsThisMonth = boostRevenueThisMonthStats._count.id;

    // Get premium subscription stats
    const [
      totalPremiumSubscriptions,
      activePremiumSubscriptions,
      expiredPremiumSubscriptions,
      premiumSubscriptionsThisWeek,
    ] = await Promise.all([
      prisma.$executeRaw<[{ count: bigint }]>`SELECT COUNT(*) as count FROM premium_subscriptions`,
      prisma.$executeRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count
        FROM premium_subscriptions
        WHERE status = 'ACTIVE' AND ends_at > ${now}
      `,
      prisma.$executeRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count
        FROM premium_subscriptions
        WHERE status = 'EXPIRED'
      `,
      prisma.$executeRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count
        FROM premium_subscriptions
        WHERE created_at >= ${startOfWeek}
      `,
    ]);

    // Calculate premium subscription revenue
    const premiumRevenueStats = await prisma.$queryRaw<[{ total_revenue: any }]>`
      SELECT COALESCE(SUM(paid_amount), 0) as total_revenue
      FROM premium_subscriptions
      WHERE paid_amount > 0
    `;

    const premiumRevenueThisMonthStats = await prisma.$queryRaw<[{ total_revenue: any; count: bigint }]>`
      SELECT COALESCE(SUM(paid_amount), 0) as total_revenue, COUNT(*) as count
      FROM premium_subscriptions
      WHERE paid_amount > 0 AND created_at >= ${startOfMonth}
    `;

    const totalPremiumRevenue = premiumRevenueStats[0]?.total_revenue
      ? Number(premiumRevenueStats[0].total_revenue)
      : 0;
    const premiumRevenueThisMonth = premiumRevenueThisMonthStats[0]?.total_revenue
      ? Number(premiumRevenueThisMonthStats[0].total_revenue)
      : 0;
    const paidPremiumSubscriptionsThisMonth = Number(premiumRevenueThisMonthStats[0]?.count ?? 0);

    // Get promotion performance stats
    const promotionPerformance = await prisma.listing_promotions.aggregate({
      where: {
        status: "ACTIVE",
        ends_at: { gt: now },
      },
      _sum: {
        views: true,
        clicks: true,
      },
      _avg: {
        view_uplift_percent: true,
        click_uplift_percent: true,
      },
    });

    // Get top boosted listings by performance
    const topBoostedListings = await prisma.listing_promotions.findMany({
      where: {
        status: "ACTIVE",
        ends_at: { gt: now },
        views: { gt: 0 },
      },
      select: {
        id: true,
        listing_id: true,
        views: true,
        clicks: true,
        view_uplift_percent: true,
        click_uplift_percent: true,
        listing: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        views: "desc",
      },
      take: 5,
    });

    const stats = {
      totalUsers,
      activeUsers,
      premiumUsers,
      totalListings,
      activeListings,
      soldListings,
      totalTransactions: allTransactions.length,
      completedTransactions,
      totalRevenue,
      revenueThisMonth,
      totalCommissionRevenue,
      commissionRevenueThisMonth,
      totalBoostRevenue,
      boostRevenueThisMonth,
      paidPromotionsTotal,
      paidPromotionsThisMonth,
      newUsersThisWeek,
      newListingsThisWeek,
      transactionsThisWeek,
      // Promotion stats
      totalPromotions,
      activePromotions,
      expiredPromotions,
      promotionsThisWeek,
      promotionTotalViews: promotionPerformance._sum.views ?? 0,
      promotionTotalClicks: promotionPerformance._sum.clicks ?? 0,
      promotionAvgViewUplift: promotionPerformance._avg.view_uplift_percent
        ? Math.round(promotionPerformance._avg.view_uplift_percent)
        : 0,
      promotionAvgClickUplift: promotionPerformance._avg.click_uplift_percent
        ? Math.round(promotionPerformance._avg.click_uplift_percent)
        : 0,
      // Premium subscription stats
      totalPremiumSubscriptions: Number(totalPremiumSubscriptions[0]?.count ?? 0),
      activePremiumSubscriptions: Number(activePremiumSubscriptions[0]?.count ?? 0),
      expiredPremiumSubscriptions: Number(expiredPremiumSubscriptions[0]?.count ?? 0),
      premiumSubscriptionsThisWeek: Number(premiumSubscriptionsThisWeek[0]?.count ?? 0),
      totalPremiumRevenue,
      premiumRevenueThisMonth,
      paidPremiumSubscriptionsThisMonth,
    };

    return NextResponse.json({
      stats,
      topItems: topItems.map((item) => ({
        id: String(item.id),
        name: item.name,
        views: item.views_count || 0,
        likes: item.likes_count || 0,
        clicks: item.clicks_count || 0,
        bag: item.bag_count || 0,
      })),
      topSellers,
      recentTransactions,
      topBoostedListings: topBoostedListings.map((promo) => ({
        id: String(promo.id),
        listingId: String(promo.listing_id),
        listingName: promo.listing?.name || `Listing ${promo.listing_id}`,
        views: promo.views ?? 0,
        clicks: promo.clicks ?? 0,
        viewUplift: promo.view_uplift_percent ?? 0,
        clickUplift: promo.click_uplift_percent ?? 0,
        ctr: promo.views > 0 ? ((promo.clicks / promo.views) * 100).toFixed(2) : "0",
      })),
    });
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
