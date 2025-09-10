"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Listing } from "@/types/admin";
import Link from "next/link";

export default function ListingDetailPage() {
  const params = useParams();
  const listingId = params.id as string;
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadListingDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/listings/${listingId}`, { cache: "no-store" });
        if (res.ok) {
          const listingData = await res.json();
          setListing(listingData);
        } else if (res.status === 404) {
          setError("Listing not found");
        } else {
          throw new Error(`HTTP ${res.status}: Failed to load listing`);
        }
      } catch (error) {
        console.error('Error loading listing details:', error);
        setError(error instanceof Error ? error.message : "Failed to load listing details");
      } finally {
        setLoading(false);
      }
    };

    if (listingId) loadListingDetails();
  }, [listingId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Listing Details</h2>
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
        <h2 className="text-xl font-semibold">Listing Details</h2>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Listing Details</h2>
        <div className="bg-white border rounded-lg p-6">
          <div className="text-center text-gray-500">Listing not found.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Listing Details</h1>
          <p className="text-sm text-gray-600 mt-1">
            Listing ID: {listingId}
          </p>
        </div>
        <Link
          href="/admin/listings"
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Listings
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Listing Image */}
        {listing.imageUrl && (
          <div className="bg-white border rounded-lg p-6">
            <img 
              src={listing.imageUrl} 
              alt={listing.name}
              className="w-full rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        
        {/* Listing Information */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Listing Information</h3>
          
          <div className="space-y-4">
            <div>
              <span className="text-sm text-gray-500">Name:</span>
              <div className="font-medium text-lg">{listing.name}</div>
            </div>
            
            <div>
              <span className="text-sm text-gray-500">Price:</span>
              <div className="text-2xl font-bold text-green-600">
                ${listing.price?.toFixed(2)}
              </div>
            </div>
            
            <div>
              <span className="text-sm text-gray-500">Status:</span>
              <div className="flex items-center">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  listing.listed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {listing.listed ? 'Listed' : 'Unlisted'}
                </span>
              </div>
            </div>

            {listing.description && (
              <div>
                <span className="text-sm text-gray-500">Description:</span>
                <div className="mt-1 p-3 bg-gray-50 rounded-md">
                  <p className="text-gray-900">{listing.description}</p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              {listing.brand && (
                <div>
                  <span className="text-sm text-gray-500">Brand:</span>
                  <div className="font-medium">{listing.brand}</div>
                </div>
              )}
              
              {listing.size && (
                <div>
                  <span className="text-sm text-gray-500">Size:</span>
                  <div className="font-medium">{listing.size}</div>
                </div>
              )}
              
              {listing.conditionType && (
                <div>
                  <span className="text-sm text-gray-500">Condition:</span>
                  <div className="font-medium capitalize">{listing.conditionType.replace('_', ' ')}</div>
                </div>
              )}
            </div>

            {listing.sellerId && (
              <div>
                <span className="text-sm text-gray-500">Seller:</span>
                <div>
                  <Link
                    href={`/admin/users/${listing.sellerId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {listing.sellerName || `User ${listing.sellerId}`}
                  </Link>
                </div>
              </div>
            )}

            <div>
              <span className="text-sm text-gray-500">Created:</span>
              <div className="font-medium">
                {new Date(listing.createdAt).toLocaleDateString()}
              </div>
            </div>
            
            {listing.tags && listing.tags.length > 0 && (
              <div>
                <span className="text-sm text-gray-500">Tags:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {listing.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Links */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Related Information</h3>
        <div className="space-y-2">
          <Link
            href={`/admin/listings/${listing.id}/transactions`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-blue-600 hover:text-blue-800"
          >
            View Transactions →
          </Link>
          <Link
            href={`/admin/listings/${listing.id}/reviews`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-blue-600 hover:text-blue-800"
          >
            View Reviews →
          </Link>
        </div>
      </div>
    </div>
  );
}
