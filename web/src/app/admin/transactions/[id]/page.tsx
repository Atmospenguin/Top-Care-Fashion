"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Transaction, Review } from "@/types/admin";
import Link from "next/link";

export default function TransactionDetailPage() {
  const params = useParams();
  const transactionId = params.id as string;
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTransactionDetails = async () => {
      try {
        setLoading(true);
        
        // Load transaction details (would need to create this API endpoint)
        const transactionRes = await fetch(`/api/admin/transactions/${transactionId}`, { cache: "no-store" });
        if (transactionRes.ok) {
          const transactionData = await transactionRes.json();
          setTransaction(transactionData);
        }

        // Load related reviews
        const reviewsRes = await fetch(`/api/admin/reviews?transactionId=${transactionId}`, { cache: "no-store" });
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setReviews(reviewsData.reviews || []);
        }
      } catch (error) {
        console.error('Error loading transaction details:', error);
        setError(error instanceof Error ? error.message : "Failed to load transaction details");
      } finally {
        setLoading(false);
      }
    };

    if (transactionId) loadTransactionDetails();
  }, [transactionId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Transaction Details</h2>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Transaction Details</h2>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Transaction Details</h1>
          <p className="text-sm text-gray-600 mt-1">
            Transaction ID: {transactionId}
          </p>
        </div>
        <Link
          href="/admin/transactions"
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Transactions
        </Link>
      </div>

      {transaction ? (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Transaction Information</h3>
            
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-500">Status:</span>
                <div className="flex items-center">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </span>
                </div>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Listing:</span>
                <div>
                  <Link
                    href={`/admin/listings/${transaction.listingId}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {transaction.listingName || `Listing ${transaction.listingId}`}
                  </Link>
                </div>
              </div>

              <div>
                <span className="text-sm text-gray-500">Quantity:</span>
                <div className="font-medium">{transaction.quantity}</div>
              </div>

              <div>
                <span className="text-sm text-gray-500">Price Each:</span>
                <div className="font-medium">${transaction.priceEach?.toFixed(2)}</div>
              </div>

              <div>
                <span className="text-sm text-gray-500">Total Amount:</span>
                <div className="text-lg font-bold text-green-600">
                  ${((transaction.priceEach || 0) * transaction.quantity).toFixed(2)}
                </div>
              </div>

              <div>
                <span className="text-sm text-gray-500">Date:</span>
                <div>{new Date(transaction.createdAt).toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Parties Involved</h3>
            
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-500">Buyer:</span>
                <div>
                  <Link
                    href={`/admin/users/${transaction.buyerId}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {transaction.buyerName || `User ${transaction.buyerId}`}
                  </Link>
                </div>
              </div>

              <div>
                <span className="text-sm text-gray-500">Seller:</span>
                <div>
                  <Link
                    href={`/admin/users/${transaction.sellerId}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {transaction.sellerName || `User ${transaction.sellerId}`}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border rounded-lg p-6">
          <div className="text-center text-gray-500">
            Transaction not found or details could not be loaded.
          </div>
        </div>
      )}

      {/* Related Reviews */}
      {reviews.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Related Reviews</h3>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{review.author}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${
                            i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700 mt-2">{review.comment}</p>
              </div>
            ))}
          </div>
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
