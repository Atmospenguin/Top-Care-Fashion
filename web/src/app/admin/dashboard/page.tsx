"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  totalListings: number;
  activeListings: number;
  soldListings: number;
  totalTransactions: number;
  completedTransactions: number;
  totalRevenue: number;
  revenueThisMonth: number;
  newUsersThisWeek: number;
  newListingsThisWeek: number;
  transactionsThisWeek: number;
}

interface TopItem {
  id: string;
  name: string;
  views: number;
  likes: number;
  clicks: number;
}

interface TopSeller {
  id: string;
  username: string;
  totalSales: number;
  revenue: number;
  rating: number | null;
}

interface RecentTransaction {
  id: string;
  buyerName: string;
  sellerName: string;
  listingName: string;
  amount: number;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/dashboard", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        setStats(data.stats);
        setTopItems(data.topItems || []);
        setTopSellers(data.topSellers || []);
        setRecentTransactions(data.recentTransactions || []);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setError(error instanceof Error ? error.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <div className="bg-white border rounded-lg p-6">
          <div className="text-center text-gray-500">No data available.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">
          Overview of your marketplace performance
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          subtext={`${stats.activeUsers} active, ${stats.premiumUsers} premium`}
          color="blue"
          link="/admin/users"
        />
        <StatCard
          title="Total Listings"
          value={stats.totalListings}
          subtext={`${stats.activeListings} active, ${stats.soldListings} sold`}
          color="green"
          link="/admin/listings"
        />
        <StatCard
          title="Transactions"
          value={stats.totalTransactions}
          subtext={`${stats.completedTransactions} completed`}
          color="purple"
          link="/admin/transactions"
        />
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toFixed(2)}`}
          subtext={`$${stats.revenueThisMonth.toFixed(2)} this month`}
          color="yellow"
          link="/admin/transactions"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActivityCard
          title="New Users"
          value={stats.newUsersThisWeek}
          period="This Week"
          color="blue"
        />
        <ActivityCard
          title="New Listings"
          value={stats.newListingsThisWeek}
          period="This Week"
          color="green"
        />
        <ActivityCard
          title="Transactions"
          value={stats.transactionsThisWeek}
          period="This Week"
          color="purple"
        />
      </div>

      {/* Top Items & Top Sellers */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Items */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Top Performing Items</h3>
          {topItems.length > 0 ? (
            <div className="space-y-3">
              {topItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/listings/${item.id}`}
                  className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-600">
                      👁 {item.views} | ❤ {item.likes} | 👆 {item.clicks}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No data available</div>
          )}
        </div>

        {/* Top Sellers */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Top Sellers</h3>
          {topSellers.length > 0 ? (
            <div className="space-y-3">
              {topSellers.map((seller) => (
                <Link
                  key={seller.id}
                  href={`/admin/users/${seller.id}`}
                  className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{seller.username}</div>
                      <div className="text-sm text-gray-600">
                        {seller.totalSales} sales • ${seller.revenue.toFixed(2)} revenue
                      </div>
                    </div>
                    {seller.rating && (
                      <div className="text-sm text-yellow-600 font-medium">
                        {seller.rating.toFixed(1)}★
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No data available</div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
          <Link
            href="/admin/transactions"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View All →
          </Link>
        </div>
        {recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="pb-2">ID</th>
                  <th className="pb-2">Buyer</th>
                  <th className="pb-2">Seller</th>
                  <th className="pb-2">Item</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="py-2 font-mono text-xs">{transaction.id}</td>
                    <td className="py-2">
                      <Link
                        href={`/admin/users/${transaction.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {transaction.buyerName}
                      </Link>
                    </td>
                    <td className="py-2">
                      <Link
                        href={`/admin/users/${transaction.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {transaction.sellerName}
                      </Link>
                    </td>
                    <td className="py-2">{transaction.listingName}</td>
                    <td className="py-2 font-medium">${transaction.amount.toFixed(2)}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="py-2 text-gray-600">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No recent transactions</div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtext,
  color,
  link,
}: {
  title: string;
  value: string | number;
  subtext: string;
  color: "blue" | "green" | "purple" | "yellow";
  link?: string;
}) {
  const colorClasses = {
    blue: "border-blue-500 bg-blue-50",
    green: "border-green-500 bg-green-50",
    purple: "border-purple-500 bg-purple-50",
    yellow: "border-yellow-500 bg-yellow-50",
  };

  const content = (
    <div className={`border-l-4 ${colorClasses[color]} rounded-lg p-4`}>
      <div className="text-sm text-gray-600 mb-1">{title}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{subtext}</div>
    </div>
  );

  if (link) {
    return (
      <Link href={link} className="block hover:opacity-80 transition">
        {content}
      </Link>
    );
  }

  return content;
}

function ActivityCard({
  title,
  value,
  period,
  color,
}: {
  title: string;
  value: number;
  period: string;
  color: "blue" | "green" | "purple";
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800",
    purple: "bg-purple-100 text-purple-800",
  };

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="text-sm text-gray-600 mb-2">{title}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        <span className={`px-2 py-1 text-xs rounded-full ${colorClasses[color]}`}>
          {period}
        </span>
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'paid':
      return 'bg-blue-100 text-blue-800';
    case 'shipped':
      return 'bg-purple-100 text-purple-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
