"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import Image from "next/image";
import Link from "next/link";
import type { Listing } from "@/types/admin";

type ListingWithExtras = Listing & {
  sellerName?: string;
  categoryName?: string;
};

export default function MarketplacePage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<ListingWithExtras[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<ListingWithExtras | null>(null);
  const [editingListing, setEditingListing] = useState<ListingWithExtras | null>(null);

  const isAdmin = user?.actor === "Admin";

  const loadListings = async () => {
    try {
      const endpoint = isAdmin ? "/api/admin/listings" : "/api/listings";
      const res = await fetch(endpoint, { cache: "no-store" });
      const data = await res.json();
      setListings(data.listings || []);
    } catch (error) {
      console.error("Failed to load listings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, [isAdmin]);

  const toggleListing = async (listingId: string, currentListed: boolean) => {
    if (!isAdmin) return;
    try {
      await fetch(`/api/admin/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listed: !currentListed })
      });
      loadListings();
    } catch (error) {
      console.error("Failed to toggle listing:", error);
    }
  };

  const deleteListing = async (listingId: string) => {
    if (!isAdmin) return;
    if (!confirm("Are you sure you want to delete this listing?")) return;
    try {
      await fetch(`/api/admin/listings/${listingId}`, { method: "DELETE" });
      loadListings();
    } catch (error) {
      console.error("Failed to delete listing:", error);
    }
  };

  const saveListing = async (listing: ListingWithExtras) => {
    if (!isAdmin) return;
    try {
      const method = editingListing?.id ? "PATCH" : "POST";
      const url = editingListing?.id 
        ? `/api/admin/listings/${editingListing.id}` 
        : "/api/admin/listings";
      
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(listing)
      });
      
      setEditingListing(null);
      loadListings();
    } catch (error) {
      console.error("Failed to save listing:", error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-64">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Listing Management</h1>
        {isAdmin && (
          <button
            onClick={() => setEditingListing({} as ListingWithExtras)}
            className="bg-[var(--brand-color)] text-white px-4 py-2 rounded-md hover:opacity-90"
          >
            Add Listing
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {listings.map((listing) => (
          <div key={listing.id} className="border border-black/10 rounded-lg overflow-hidden bg-white">
            <div className="aspect-square bg-gray-100 relative">
              {listing.imageUrl ? (
                <Image
                  src={listing.imageUrl}
                  alt={listing.name}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No Image
                </div>
              )}
            </div>
            
            <div className="p-4">
              <h3 className="font-medium text-sm mb-1 truncate">{listing.name}</h3>
              <p className="text-2xl font-bold text-[var(--brand-color)] mb-2">
                ${listing.price?.toFixed(2)}
              </p>
              
              {listing.description && (
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                  {listing.description}
                </p>
              )}
              
              <div className="text-xs text-gray-500 space-y-1">
                {listing.brand && <div>Brand: {listing.brand}</div>}
                {listing.size && <div>Size: {listing.size}</div>}
                {listing.conditionType && (
                  <div>Condition: {listing.conditionType.replace('_', ' ')}</div>
                )}
                {listing.sellerName && <div>Seller: {listing.sellerName}</div>}
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    listing.listed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {listing.listed ? 'Listed' : 'Unlisted'}
                  </span>
                  
                  <button
                    onClick={() => setSelectedListing(listing)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    View Details
                  </button>
                </div>

                {isAdmin && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingListing(listing)}
                      className="flex-1 px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleListing(listing.id, listing.listed)}
                      className={`px-3 py-1 text-xs rounded ${
                        listing.listed 
                          ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800' 
                          : 'bg-green-100 hover:bg-green-200 text-green-800'
                      }`}
                    >
                      {listing.listed ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={() => deleteListing(listing.id)}
                      className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-800 rounded"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {listings.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No listings found. {isAdmin && "Create your first listing to get started."}
        </div>
      )}

      {/* Detail Modal */}
      {selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">{selectedListing.name}</h3>
              <button
                onClick={() => setSelectedListing(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {selectedListing.imageUrl && (
                <div>
                  <img 
                    src={selectedListing.imageUrl} 
                    alt={selectedListing.name}
                    className="w-full rounded-lg"
                  />
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-[var(--brand-color)]">
                    ${selectedListing.price?.toFixed(2)}
                  </h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    selectedListing.listed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedListing.listed ? 'Listed' : 'Unlisted'}
                  </span>
                </div>
                
                {selectedListing.description && (
                  <div>
                    <h5 className="font-medium text-gray-700 mb-1">Description</h5>
                    <p className="text-gray-600">{selectedListing.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedListing.brand && (
                    <div>
                      <span className="text-gray-500">Brand:</span>
                      <div className="font-medium">{selectedListing.brand}</div>
                    </div>
                  )}
                  {selectedListing.size && (
                    <div>
                      <span className="text-gray-500">Size:</span>
                      <div className="font-medium">{selectedListing.size}</div>
                    </div>
                  )}
                  {selectedListing.conditionType && (
                    <div>
                      <span className="text-gray-500">Condition:</span>
                      <div className="font-medium capitalize">{selectedListing.conditionType.replace('_', ' ')}</div>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">ID:</span>
                    <div className="font-medium">{selectedListing.id}</div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="pt-4 border-t space-y-2">
                    <Link
                      href={`/admin/listings/${selectedListing.id}/transactions`}
                      className="block text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View Transactions →
                    </Link>
                    <Link
                      href={`/admin/listings/${selectedListing.id}/reviews`}
                      className="block text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View Reviews →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingListing.id ? 'Edit Listing' : 'Create New Listing'}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              saveListing(editingListing);
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={editingListing.name || ''}
                  onChange={(e) => setEditingListing({ ...editingListing, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Enter listing name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editingListing.price || 0}
                  onChange={(e) => setEditingListing({ ...editingListing, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={editingListing.description || ''}
                  onChange={(e) => setEditingListing({ ...editingListing, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  placeholder="Enter listing description"
                />
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingListing.listed || false}
                    onChange={(e) => setEditingListing({ ...editingListing, listed: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Listed (Visible to customers)</span>
                </label>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setEditingListing(null)}
                  className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[var(--brand-color)] text-white rounded-md hover:opacity-90"
                >
                  {editingListing.id ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}