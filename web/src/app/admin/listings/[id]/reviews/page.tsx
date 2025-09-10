"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Review } from "@/types/admin";
import Link from "next/link";

export default function ListingReviewsPage() {
  const params = useParams();
  const listingId = params.id as string;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/listings/${listingId}/reviews`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setReviews(data.reviews || []);
      } catch (error) {
        console.error('Error loading reviews:', error);
        setError(error instanceof Error ? error.message : "Failed to load reviews");
      } finally {
        setLoading(false);
      }
    };

    if (listingId) loadReviews();
  }, [listingId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Listing Reviews</h2>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Listing Reviews</h2>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">Error: {error}</div>
        </div>
      </div>
    );
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Listing Reviews</h1>
          <p className="text-sm text-gray-600 mt-1">
            {reviews.length} reviews • Average: {averageRating.toFixed(1)} stars
          </p>
        </div>
        <Link
          href="/admin/listings"
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Listings
        </Link>
      </div>

      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div>
                    <h3 className="font-medium">{review.author}</h3>
                    <div className="flex items-center space-x-2 mt-1">
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
                      <span className="text-sm text-gray-500">
                        {review.rating}/5 stars
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString()}
                </div>
              </div>
              
              <p className="text-gray-700 mb-4">{review.comment}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="space-x-4">
                  <span>Review ID: {review.id}</span>
                  {review.transactionId && (
                    <Link
                      href={`/admin/transactions/${review.transactionId}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Transaction: {review.transactionId}
                    </Link>
                  )}
                  {review.authorUserId && (
                    <Link
                      href={`/admin/users/${review.authorUserId}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View User Profile
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          No reviews found for this listing.
        </div>
      )}
    </div>
  );
}
