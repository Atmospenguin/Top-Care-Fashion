"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import type { Listing } from "@/types/admin";
import Link from "next/link";

type EditingListing = Listing;

type ViewMode = "grid" | "table";
type FilterType = "all" | "listed" | "unlisted";

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

export default function ListingManagementPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<EditingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const isAdmin = user?.actor === "Admin";

  const loadListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const endpoint = isAdmin ? "/api/admin/listings" : "/api/listings";
      const res = await fetch(endpoint, { cache: "no-store" });
      
      if (!res.ok) {
        if (res.status === 403) {
          setError("Access denied. Admin privileges required.");
          return;
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      setItems((json.listings || []) as EditingListing[]);
    } catch (error) {
      console.error('Error loading listings:', error);
      setError(error instanceof Error ? error.message : "Failed to load listings");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);
  // Editing moved to Listing Details page; no inline edit via query string.

  const filteredItems = items.filter(item => {
    if (filter !== "all" && item.listed !== (filter === "listed")) return false;
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const deleteListing = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      const res = await fetch(`/api/admin/listings/${id}`, { method: "DELETE" });
      if (res.ok) {
        const data = await res.json().catch(() => ({ ok: true }));
        if (data.softDeleted) {
          alert('Listing has related transactions. It was unlisted instead.');
        }
        await loadListings();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to delete listing');
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('Error deleting listing');
    }
  };

  const toggleListing = async (listingId: string, currentListed: boolean) => {
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



  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Listing Management</h2>
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
        <h2 className="text-2xl font-semibold">Listing Management</h2>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">Error: {error}</div>
          <button 
            onClick={loadListings}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Listing Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            {filteredItems.length} of {items.length} listings
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <>
              <div className="flex border rounded-md">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1 text-sm ${viewMode === "grid" ? "bg-gray-100" : ""}`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1 text-sm ${viewMode === "table" ? "bg-gray-100" : ""}`}
                >
                  Table
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search listings..."
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
            title="Filter listings by status"
          >
            <option value="all">All Listings</option>
            <option value="listed">Listed Only</option>
            <option value="unlisted">Unlisted Only</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isAdmin={isAdmin}
              onDelete={deleteListing}
              onToggleListing={toggleListing}
            />
          ))}
        </div>
      ) : (
        <ListingTable
          listings={filteredItems}
          isAdmin={isAdmin}
          onDelete={deleteListing}
        />
      )}

      {filteredItems.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {searchTerm || filter !== "all" 
            ? "No listings match your search criteria."
            : "No listings found. Create your first listing to get started."
          }
        </div>
      )}

      {/* Creation disabled in management UI */}

    </div>
  );
}

// Components
function ListingCard({ 
  listing, 
  isAdmin, 
  onDelete, 
  onToggleListing, 
}: {
  listing: EditingListing;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onToggleListing: (id: string, listed: boolean) => void;
}) {
  return (
    <div className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {listing.imageUrl && (
        <div className="aspect-square overflow-hidden">
          <img 
            src={listing.imageUrl} 
            alt={listing.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-sm truncate flex-1">{listing.name}</h3>
          <div className="flex items-center gap-2">
            {listing.txStatus && (
              <span className={`px-2 py-1 text-xs rounded-full ${getTxColor(listing.txStatus)}`}>
                {listing.txStatus}
              </span>
            )}
            <span className={`px-2 py-1 text-xs rounded-full ${
              listing.listed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {listing.listed ? 'Listed' : 'Unlisted'}
            </span>
          </div>
        </div>
        
        <p className="text-2xl font-bold text-[var(--brand-color)] mb-2">
          ${listing.price?.toFixed(2)}
        </p>
        
        <div className="text-xs text-gray-600 space-y-1">
          {listing.brand && <div>Brand: {listing.brand}</div>}
          {listing.size && <div>Size: {listing.size}</div>}
          {listing.conditionType && (
            <div>Condition: {listing.conditionType.replace('_', ' ')}</div>
          )}
        </div>

        {/* Seller Information */}
        {listing.sellerId && (
          <div className="mt-2 flex items-center space-x-2">
            <span className="text-xs text-gray-500">Seller:</span>
            <Link
              href={`/admin/users/${listing.sellerId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              {listing.sellerName || `User ${listing.sellerId}`}
            </Link>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <Link
            href={`/admin/listings/${listing.id}`}
            className="flex-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-center"
          >
            Details
          </Link>
          {isAdmin && (
            <>
              <button
                onClick={() => onToggleListing(listing.id, listing.listed)}
                className={`px-3 py-1 text-xs rounded ${
                  listing.listed 
                    ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800' 
                    : 'bg-green-100 hover:bg-green-200 text-green-800'
                }`}
              >
                {listing.listed ? 'Unlist' : 'List'}
              </button>
              <button
                onClick={() => onDelete(listing.id)}
                className="px-3 py-1 text-xs rounded bg-red-100 hover:bg-red-200 text-red-800"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ListingTable({ 
  listings, 
  isAdmin, 
  onDelete 
}: {
  listings: EditingListing[];
  isAdmin: boolean;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
              {isAdmin && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {listings.map((listing) => (
              <ListingTableRow
                key={listing.id}
                listing={listing}
                isAdmin={isAdmin}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ListingTableRow({ 
  listing, 
  isAdmin, 
  onDelete, 
}: {
  listing: EditingListing;
  isAdmin: boolean;
  onDelete: (id: string) => void;
}) {
  return (
    <tr>
      <td className="px-4 py-3">
        <div className="flex items-center">
          {listing.imageUrl && (
            <img 
              src={listing.imageUrl} 
              alt={listing.name}
              className="w-8 h-8 rounded object-cover mr-3"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <span className="text-sm font-medium">{listing.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm">${listing.price?.toFixed(2)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {listing.txStatus && (
            <span className={`px-2 py-1 text-xs rounded-full ${getTxColor(listing.txStatus)}`}>
              {listing.txStatus}
            </span>
          )}
          <span className={`px-2 py-1 text-xs rounded-full ${
            listing.listed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {listing.listed ? 'Listed' : 'Unlisted'}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm">{listing.brand || '-'}</td>
      <td className="px-4 py-3 text-sm capitalize">{listing.conditionType?.replace('_', ' ') || 'Good'}</td>
      {isAdmin && (
        <td className="px-4 py-3">
          <div className="flex gap-3">
            <Link
              href={`/admin/listings/${listing.id}`}
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              Details
            </Link>
            <button
              onClick={() => onDelete(listing.id)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Delete
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}

