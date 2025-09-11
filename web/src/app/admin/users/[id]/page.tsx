"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { UserAccount, Transaction, Listing } from "@/types/admin";
import Link from "next/link";

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.id as string;
  const [user, setUser] = useState<UserAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [userRating, setUserRating] = useState<{ averageRating: number | null; totalReviews: number }>({ 
    averageRating: null, 
    totalReviews: 0 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserDetails = async () => {
      try {
        setLoading(true);
        
        // Load user details
        const userRes = await fetch(`/api/admin/users/${userId}`, { cache: "no-store" });
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
        } else if (userRes.status === 404) {
          setError("User not found");
        } else {
          throw new Error(`HTTP ${userRes.status}: Failed to load user`);
        }

        // Load user's transactions
        try {
          const transactionsRes = await fetch(`/api/admin/users/${userId}/transactions`, { cache: "no-store" });
          if (transactionsRes.ok) {
            const transactionsData = await transactionsRes.json();
            setTransactions(transactionsData.transactions || []);
          }
        } catch (error) {
          console.log("Could not load transactions:", error);
        }

        // Load user's listings
        try {
          const listingsRes = await fetch(`/api/admin/users/${userId}/listings`, { cache: "no-store" });
          if (listingsRes.ok) {
            const listingsData = await listingsRes.json();
            setListings(listingsData.listings || []);
          }
        } catch (error) {
          console.log("Could not load listings:", error);
        }

        // Load user's reviews
        try {
          const reviewsRes = await fetch(`/api/admin/users/${userId}/reviews`, { cache: "no-store" });
          if (reviewsRes.ok) {
            const reviewsData = await reviewsRes.json();
            setReviews(reviewsData.reviews || []);
            // Coerce ratings to the correct types and guard against invalid values
            const rawAvg = reviewsData?.averageRating;
            const avg =
              typeof rawAvg === 'number'
                ? rawAvg
                : typeof rawAvg === 'string'
                ? parseFloat(rawAvg)
                : null;

            const safeAvg = Number.isFinite(avg as number) ? (avg as number) : null;
            const safeTotal = Number(reviewsData?.totalReviews) || 0;

            setUserRating({
              averageRating: safeAvg,
              totalReviews: safeTotal,
            });
          }
        } catch (error) {
          console.log("Could not load reviews:", error);
        }
      } catch (error) {
        console.error('Error loading user details:', error);
        setError(error instanceof Error ? error.message : "Failed to load user details");
      } finally {
        setLoading(false);
      }
    };

    if (userId) loadUserDetails();
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">User Details</h2>
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
        <h2 className="text-xl font-semibold">User Details</h2>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">User Details</h2>
        <div className="bg-white border rounded-lg p-6">
          <div className="text-center text-gray-500">User not found.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">User Details</h1>
          <p className="text-sm text-gray-600 mt-1">
            User ID: {userId}
          </p>
        </div>
        <Link
          href="/admin/users"
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Users
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* User Information */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">User Information</h3>
          
          <div className="space-y-4">
            <div>
              <span className="text-sm text-gray-500">Username:</span>
              <div className="font-medium">{user.username}</div>
            </div>
            
            <div>
              <span className="text-sm text-gray-500">Email:</span>
              <div className="font-medium">{user.email}</div>
            </div>

            <div>
              <span className="text-sm text-gray-500">Role:</span>
              <div className="font-medium">{user.role}</div>
            </div>

            <div>
              <span className="text-sm text-gray-500">Status:</span>
              <div className="flex items-center">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  user.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.status}
                </span>
              </div>
            </div>

            <div>
              <span className="text-sm text-gray-500">Premium Member:</span>
              <div className="font-medium">
                {user.is_premium ? (
                  <span className="text-green-600">Yes</span>
                ) : (
                  <span className="text-gray-600">No</span>
                )}
              </div>
            </div>

            {user.premium_until && (
              <div>
                <span className="text-sm text-gray-500">Premium Until:</span>
                <div className="font-medium">
                  {new Date(user.premium_until).toLocaleDateString()}
                </div>
              </div>
            )}

            <div>
              <span className="text-sm text-gray-500">Member Since:</span>
              <div className="font-medium">
                {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Activity Statistics</h3>
          
          <div className="space-y-4">
            <div>
              <span className="text-sm text-gray-500">Total Listings:</span>
              <div className="text-lg font-bold text-blue-600">{listings.length}</div>
            </div>
            
            <div>
              <span className="text-sm text-gray-500">Items Sold:</span>
              <div className="text-lg font-bold text-green-600">
                {transactions.filter(t => t.sellerId === userId && t.status === 'completed').length}
              </div>
            </div>

            <div>
              <span className="text-sm text-gray-500">Items Bought:</span>
              <div className="text-lg font-bold text-blue-600">
                {transactions.filter(t => t.buyerId === userId && t.status === 'completed').length}
              </div>
            </div>

            <div>
              <span className="text-sm text-gray-500">Active Listings:</span>
              <div className="text-lg font-bold text-purple-600">
                {listings.filter(l => l.listed).length}
              </div>
            </div>

            <div>
              <span className="text-sm text-gray-500">Total Transactions:</span>
              <div className="text-lg font-bold text-gray-600">{transactions.length}</div>
            </div>

            <div>
              <span className="text-sm text-gray-500">User Rating:</span>
              <div className="flex items-center space-x-2">
                {userRating.averageRating !== null ? (
                  <>
                    <div className="text-lg font-bold text-yellow-600">
                      {userRating.averageRating.toFixed(1)}★
                    </div>
                    <div className="text-sm text-gray-500">
                      ({userRating.totalReviews} reviews)
                    </div>
                  </>
                ) : (
                  <div className="text-lg font-bold text-gray-400">No reviews yet</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Reviews */}
      {reviews.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            Reviews Received ({userRating.totalReviews})
            {userRating.averageRating && (
              <span className="ml-2 text-yellow-600">
                {userRating.averageRating.toFixed(1)}★ average
              </span>
            )}
          </h3>
          <div className="space-y-4">
            {reviews.slice(0, 5).map((review) => (
              <div key={review.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/admin/users/${review.reviewerId}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {review.reviewerName}
                    </Link>
                    <span className="text-sm text-gray-500">
                      ({review.reviewerType})
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      {review.rating}/5
                    </span>
                  </div>
                </div>
                <p className="text-gray-700 mb-2">{review.comment}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div>
                    Transaction: 
                    <Link
                      href={`/admin/transactions/${review.transactionId}`}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      {review.transactionId}
                    </Link>
                    {review.listingName && (
                      <>
                        {" for "}
                        <Link
                          href={`/admin/listings/${review.listingId}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {review.listingName}
                        </Link>
                      </>
                    )}
                  </div>
                  <div>{new Date(review.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
          {reviews.length > 5 && (
            <div className="mt-4 text-center">
              <span className="text-gray-500">
                Showing 5 of {reviews.length} reviews
              </span>
            </div>
          )}
        </div>
      )}

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="pb-2">ID</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Listing</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Reviews</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.slice(0, 10).map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="py-2">
                      <Link
                        href={`/admin/transactions/${transaction.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {transaction.id}
                      </Link>
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        transaction.buyerId === userId 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {transaction.buyerId === userId ? 'Bought' : 'Sold'}
                      </span>
                    </td>
                    <td className="py-2">
                      <Link
                        href={`/admin/listings/${transaction.listingId}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {transaction.listingName || `Listing ${transaction.listingId}`}
                      </Link>
                    </td>
                    <td className="py-2">
                      ${((transaction.priceEach || 0) * transaction.quantity).toFixed(2)}
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="py-2">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2">
                      {transaction.status === 'completed' && (
                        <Link
                          href={`/admin/transactions/${transaction.id}#reviews`}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          View Reviews
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User's Listings */}
      {listings.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">User's Listings</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.slice(0, 6).map((listing) => (
              <div key={listing.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium truncate">{listing.name}</h4>
                  <div className="flex space-x-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      listing.listed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {listing.listed ? 'Listed' : 'Unlisted'}
                    </span>
                    {listing.sold && (
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        Sold
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {listing.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-green-600">
                    ${listing.price.toFixed(2)}
                  </span>
                  <Link
                    href={`/admin/listings/${listing.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
          {listings.length > 6 && (
            <div className="mt-4 text-center">
              <Link
                href={`/admin/listings?seller=${userId}`}
                className="text-blue-600 hover:text-blue-800"
              >
                View all {listings.length} listings →
              </Link>
            </div>
          )}
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
