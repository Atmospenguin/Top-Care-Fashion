"use client";

import { useEffect, useState } from "react";
import type { Transaction } from "@/types/admin";
import Link from "next/link";

type FilterType = "all" | "pending" | "paid" | "shipped" | "completed" | "cancelled";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/transactions", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setTransactions(data.transactions || []);
      } catch (error) {
        console.error('Error loading transactions:', error);
        setError(error instanceof Error ? error.message : "Failed to load transactions");
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, []);

  const filteredTransactions = transactions.filter(transaction => {
    if (filter !== "all" && transaction.status !== filter) return false;
    if (searchTerm && !transaction.listingName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !transaction.buyerName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !transaction.sellerName?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Transaction Management</h2>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Transaction Management</h2>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">Error: {error}</div>
        </div>
      </div>
    );
  }

  const totalRevenue = filteredTransactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + (t.priceEach || 0) * t.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Transaction Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            {filteredTransactions.length} of {transactions.length} transactions
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Total Revenue (Completed)</div>
          <div className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {(['pending', 'paid', 'shipped', 'completed', 'cancelled'] as const).map(status => {
          const count = transactions.filter(t => t.status === status).length;
          return (
            <div key={status} className="bg-white border rounded-lg p-4">
              <div className="text-sm text-gray-600 capitalize">{status}</div>
              <div className="text-2xl font-bold">{count}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by listing, buyer, or seller..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Transactions</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="shipped">Shipped</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      {filteredTransactions.length > 0 ? (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Listing</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-4 py-3 text-sm font-mono">{transaction.id}</td>
                    <td className="px-4 py-3 text-sm">
                      <Link
                        href={`/admin/listings/${transaction.listingId}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {transaction.listingName || `Listing ${transaction.listingId}`}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Link
                        href={`/admin/users/${transaction.buyerId}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {transaction.buyerName || `User ${transaction.buyerId}`}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Link
                        href={`/admin/users/${transaction.sellerId}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {transaction.sellerName || `User ${transaction.sellerId}`}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm">{transaction.quantity}</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      ${((transaction.priceEach || 0) * transaction.quantity).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/transactions/${transaction.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          {searchTerm || filter !== "all" 
            ? "No transactions match your search criteria."
            : "No transactions found."
          }
        </div>
      )}
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
