"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import type { Listing, Transaction, Review, UserAccount } from "@/types/admin";
import Link from "next/link";

interface EditingListing extends Listing {
  editing?: boolean;
}

type ViewMode = "grid" | "table";
type FilterType = "all" | "listed" | "unlisted";

export default function ListingManagementPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<EditingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const isAdmin = user?.actor === "Admin";

  const loadListings = async () => {
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
      setItems((json.listings || []).map((l: Listing) => ({ ...l, editing: false })));
    } catch (error) {
      console.error('Error loading listings:', error);
      setError(error instanceof Error ? error.message : "Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, [isAdmin]);

  const filteredItems = items.filter(item => {
    if (filter !== "all" && item.listed !== (filter === "listed")) return false;
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const startEdit = (id: string) => {
    setItems(items.map(item => ({ 
      ...item, 
      editing: item.id === id ? true : false 
    })));
  };

  const cancelEdit = (id: string) => {
    setItems(items.map(item => ({ 
      ...item, 
      editing: item.id === id ? false : item.editing 
    })));
    loadListings(); // Reload to reset changes
  };

  const saveEdit = async (listing: EditingListing) => {
    try {
      setSaving(listing.id);
      const updateData = {
        name: listing.name,
        description: listing.description,
        price: listing.price,
        brand: listing.brand,
        size: listing.size,
        conditionType: listing.conditionType,
        imageUrl: listing.imageUrl,
        listed: listing.listed,
        tags: listing.tags
      };

      const res = await fetch(`/api/admin/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      });

      if (res.ok) {
        setItems(items.map(item => ({ 
          ...item, 
          editing: item.id === listing.id ? false : item.editing 
        })));
        loadListings();
      } else {
        console.error('Failed to save listing');
      }
    } catch (error) {
      console.error('Error saving listing:', error);
    } finally {
      setSaving(null);
    }
  };

  const deleteListing = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      await fetch(`/api/admin/listings/${id}`, { method: "DELETE" });
      loadListings();
    } catch (error) {
      console.error('Error deleting listing:', error);
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

  const updateField = (id: string, field: keyof Listing, value: any) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const createListing = async (listingData: Partial<Listing>) => {
    try {
      const res = await fetch("/api/admin/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(listingData)
      });
      
      if (res.ok) {
        setShowCreateForm(false);
        loadListings();
      } else {
        console.error('Failed to create listing');
      }
    } catch (error) {
      console.error('Error creating listing:', error);
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
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-[var(--brand-color)] text-white px-4 py-2 rounded-md hover:opacity-90"
              >
                Create Listing
              </button>
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
              onEdit={startEdit}
              onDelete={deleteListing}
              onToggleListing={toggleListing}
            />
          ))}
        </div>
      ) : (
        <ListingTable
          listings={filteredItems}
          isAdmin={isAdmin}
          onEdit={startEdit}
          onCancel={cancelEdit}
          onSave={saveEdit}
          onDelete={deleteListing}
          onUpdateField={updateField}
          saving={saving}
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

      {/* Create Form Modal */}
      {showCreateForm && (
        <CreateListingModal
          onClose={() => setShowCreateForm(false)}
          onCreate={createListing}
        />
      )}

    </div>
  );
}

// Components
function ListingCard({ 
  listing, 
  isAdmin, 
  onEdit, 
  onDelete, 
  onToggleListing, 
}: {
  listing: EditingListing;
  isAdmin: boolean;
  onEdit: (id: string) => void;
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
          <span className={`px-2 py-1 text-xs rounded-full ml-2 ${
            listing.listed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {listing.listed ? 'Listed' : 'Unlisted'}
          </span>
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
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-center"
          >
            View Details
          </Link>
          {isAdmin && (
            <>
              <button
                onClick={() => onEdit(listing.id)}
                className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => onToggleListing(listing.id, listing.listed)}
                className={`px-3 py-1 text-xs rounded ${
                  listing.listed 
                    ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800' 
                    : 'bg-green-100 hover:bg-green-200 text-green-800'
                }`}
              >
                {listing.listed ? 'Hide' : 'Show'}
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
  onEdit, 
  onCancel, 
  onSave, 
  onDelete, 
  onUpdateField, 
  saving 
}: {
  listings: EditingListing[];
  isAdmin: boolean;
  onEdit: (id: string) => void;
  onCancel: (id: string) => void;
  onSave: (listing: EditingListing) => void;
  onDelete: (id: string) => void;
  onUpdateField: (id: string, field: keyof Listing, value: any) => void;
  saving: string | null;
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
                onEdit={onEdit}
                onCancel={onCancel}
                onSave={onSave}
                onDelete={onDelete}
                onUpdateField={onUpdateField}
                saving={saving}
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
  onEdit, 
  onCancel, 
  onSave, 
  onDelete, 
  onUpdateField, 
  saving 
}: {
  listing: EditingListing;
  isAdmin: boolean;
  onEdit: (id: string) => void;
  onCancel: (id: string) => void;
  onSave: (listing: EditingListing) => void;
  onDelete: (id: string) => void;
  onUpdateField: (id: string, field: keyof Listing, value: any) => void;
  saving: string | null;
}) {
  if (listing.editing) {
    return (
      <tr className="bg-blue-50">
        <td className="px-4 py-3">
          <input
            type="text"
            value={listing.name}
            onChange={(e) => onUpdateField(listing.id, 'name', e.target.value)}
            className="w-full px-2 py-1 text-sm border rounded"
            placeholder="Listing name"
          />
        </td>
        <td className="px-4 py-3">
          <input
            type="number"
            step="0.01"
            value={listing.price}
            onChange={(e) => onUpdateField(listing.id, 'price', parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1 text-sm border rounded"
            placeholder="0.00"
          />
        </td>
        <td className="px-4 py-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={listing.listed}
              onChange={(e) => onUpdateField(listing.id, 'listed', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Listed</span>
          </label>
        </td>
        <td className="px-4 py-3">
          <input
            type="text"
            value={listing.brand || ''}
            onChange={(e) => onUpdateField(listing.id, 'brand', e.target.value)}
            className="w-full px-2 py-1 text-sm border rounded"
            placeholder="Brand"
          />
        </td>
        <td className="px-4 py-3">
          <select
            value={listing.conditionType || 'good'}
            onChange={(e) => onUpdateField(listing.id, 'conditionType', e.target.value)}
            className="w-full px-2 py-1 text-sm border rounded"
            title="Select condition"
          >
            <option value="new">New</option>
            <option value="like_new">Like New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </td>
        {isAdmin && (
          <td className="px-4 py-3">
            <div className="flex gap-2">
              <button
                onClick={() => onSave(listing)}
                disabled={saving === listing.id}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {saving === listing.id ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => onCancel(listing.id)}
                className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </td>
        )}
      </tr>
    );
  }

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
        <span className={`px-2 py-1 text-xs rounded-full ${
          listing.listed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {listing.listed ? 'Listed' : 'Unlisted'}
        </span>
      </td>
      <td className="px-4 py-3 text-sm">{listing.brand || '-'}</td>
      <td className="px-4 py-3 text-sm capitalize">{listing.conditionType?.replace('_', ' ') || 'Good'}</td>
      {isAdmin && (
        <td className="px-4 py-3">
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(listing.id)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(listing.id)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Delete
            </button>
            <Link
              href={`/admin/listings/${listing.id}`}
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              Details
            </Link>
          </div>
        </td>
      )}
    </tr>
  );
}

function CreateListingModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (data: Partial<Listing>) => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    brand: '',
    size: '',
    conditionType: 'good' as const,
    imageUrl: '',
    listed: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Create New Listing</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
              placeholder="Enter listing description"
            />
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[var(--brand-color)] text-white rounded-md hover:opacity-90"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

