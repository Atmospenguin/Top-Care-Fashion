"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Listing } from "@/types/admin";
import Link from "next/link";

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: 0,
    brand: "",
    size: "",
    conditionType: "good" as Listing["conditionType"],
    imageUrl: "",
    listed: true,
    tags: [] as string[] | null,
  });

  useEffect(() => {
    const loadListingDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/listings/${listingId}`, { cache: "no-store" });
        if (res.ok) {
          const listingData = await res.json();
          setListing(listingData);
          setForm({
            name: listingData.name || "",
            description: listingData.description || "",
            price: Number(listingData.price) || 0,
            brand: listingData.brand || "",
            size: listingData.size || "",
            conditionType: listingData.conditionType || 'good',
            imageUrl: listingData.imageUrl || "",
            listed: !!listingData.listed,
            tags: Array.isArray(listingData.tags) ? listingData.tags : (listingData.tags ? [String(listingData.tags)] : []),
          });
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
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-600">Listing ID: {listingId}</p>
            {listing.txStatus && (
              <span className={`px-2 py-0.5 text-xs rounded-full ${getTxColor(listing.txStatus)}`}>
                {listing.txStatus}
              </span>
            )}
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              listing.listed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {listing.listed ? 'Listed' : 'Unlisted'}
            </span>
          </div>
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
              {editing ? (
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                  placeholder="Listing name"
                />
              ) : (
                <div className="font-medium text-lg">{listing.name}</div>
              )}
            </div>
            
            <div>
              <span className="text-sm text-gray-500">Price:</span>
              {editing ? (
                <input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                  placeholder="0.00"
                />
              ) : (
                <div className="text-2xl font-bold text-green-600">
                  ${listing.price?.toFixed(2)}
                </div>
              )}
            </div>
            
            <div>
              <span className="text-sm text-gray-500">Status:</span>
              {editing ? (
                <label className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    checked={form.listed}
                    onChange={(e) => setForm({ ...form, listed: e.target.checked })}
                  />
                  <span className="text-sm">Listed</span>
                </label>
              ) : (
                <div className="flex items-center">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    listing.listed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {listing.listed ? 'Listed' : 'Unlisted'}
                  </span>
                </div>
              )}
            </div>

            <div>
              <span className="text-sm text-gray-500">Description:</span>
              {editing ? (
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                  rows={3}
                  placeholder="Enter description"
                />
              ) : (
                listing.description && (
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <p className="text-gray-900">{listing.description}</p>
                  </div>
                )
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Brand:</span>
                {editing ? (
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-md"
                    placeholder="Brand"
                  />
                ) : (
                  listing.brand && <div className="font-medium">{listing.brand}</div>
                )}
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Size:</span>
                {editing ? (
                  <input
                    type="text"
                    value={form.size}
                    onChange={(e) => setForm({ ...form, size: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-md"
                    placeholder="Size"
                  />
                ) : (
                  listing.size && <div className="font-medium">{listing.size}</div>
                )}
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Condition:</span>
                {editing ? (
                  <select
                    value={form.conditionType || 'good'}
                    onChange={(e) => setForm({ ...form, conditionType: e.target.value as any })}
                    className="mt-1 w-full px-3 py-2 border rounded-md capitalize"
                  >
                    <option value="new">New</option>
                    <option value="like_new">Like New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                ) : (
                  listing.conditionType && (
                    <div className="font-medium capitalize">{listing.conditionType.replace('_', ' ')}</div>
                  )
                )}
              </div>
            </div>

            <div>
              <span className="text-sm text-gray-500">Image URL:</span>
              {editing ? (
                <input
                  type="text"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                  placeholder="https://..."
                />
              ) : (
                listing.imageUrl && <div className="font-medium break-all">{listing.imageUrl}</div>
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
            
            <div>
              <span className="text-sm text-gray-500">Tags:</span>
              {editing ? (
                <input
                  type="text"
                  value={(form.tags || []).join(', ')}
                  onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                  placeholder="tag1, tag2, tag3"
                />
              ) : (
                listing.tags && listing.tags.length > 0 && (
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
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Listing Management */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Listing Management</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={async () => {
              try {
                const res = await fetch(`/api/admin/listings/${listing.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ listed: !listing.listed })
                });
                if (res.ok) {
                  const updated = await res.json();
                  setListing(updated);
                }
              } catch (err) {
                console.error('Toggle list failed', err);
              }
            }}
            className={`px-4 py-2 text-sm rounded-md ${listing.listed ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 'bg-green-600 text-white hover:bg-green-700'}`}
          >
            {listing.listed ? 'Unlist' : 'List'}
          </button>
          <button
            onClick={async () => {
              if (!confirm('Are you sure you want to delete this listing?')) return;
              try {
                const res = await fetch(`/api/admin/listings/${listing.id}`, { method: 'DELETE' });
                if (res.ok) {
                  const data = await res.json().catch(() => ({ ok: true }));
                  if (data.softDeleted) {
                    alert('Listing has related transactions. It was unlisted instead.');
                  }
                  router.push('/admin/listings');
                } else {
                  const err = await res.json().catch(() => ({}));
                  alert(err.error || 'Failed to delete listing');
                }
              } catch (err) {
                console.error('Delete failed', err);
                alert('Error deleting listing');
              }
            }}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete
          </button>
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

function getTxColor(status?: string) {
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
