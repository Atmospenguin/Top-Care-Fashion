"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/types/admin";

interface EditingProduct extends Product {
  editing?: boolean;
}

export default function ProductsPage() {
  const [items, setItems] = useState<EditingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/products", { cache: "no-store" });
      
      if (!res.ok) {
        if (res.status === 403) {
          setError("Access denied. Admin privileges required.");
          return;
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      setItems((json.products || []).map((p: Product) => ({ ...p, editing: false })));
    } catch (error) {
      console.error('Error loading products:', error);
      setError(error instanceof Error ? error.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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
    load(); // Reload to reset changes
  };

  const saveEdit = async (product: EditingProduct) => {
    try {
      setSaving(product.id);
      const updateData = {
        name: product.name,
        description: product.description,
        price: product.price,
        brand: product.brand,
        size: product.size,
        conditionType: product.conditionType,
        imageUrl: product.imageUrl,
        listed: product.listed,
        tags: product.tags
      };

      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      });

      if (res.ok) {
        setItems(items.map(item => ({ 
          ...item, 
          editing: item.id === product.id ? false : item.editing 
        })));
        load();
      } else {
        console.error('Failed to save product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setSaving(null);
    }
  };

  const deleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
        load();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const updateField = (id: string, field: keyof Product, value: any) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Products Management</h2>
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
        <h2 className="text-xl font-semibold">Products Management</h2>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">Error: {error}</div>
          <button 
            onClick={load}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Products Management</h2>
        <div className="text-sm text-gray-600">
          {items.length} products total
        </div>
      </div>

      <div className="grid gap-4">
        {items.map((product) => (
          <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            {product.editing ? (
              // Edit Mode
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={`name-${product.id}`} className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                    <input
                      id={`name-${product.id}`}
                      type="text"
                      value={product.name}
                      onChange={(e) => updateField(product.id, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter product name"
                    />
                  </div>
                  <div>
                    <label htmlFor={`price-${product.id}`} className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                    <input
                      id={`price-${product.id}`}
                      type="number"
                      step="0.01"
                      value={product.price}
                      onChange={(e) => updateField(product.id, 'price', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label htmlFor={`brand-${product.id}`} className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                    <input
                      id={`brand-${product.id}`}
                      type="text"
                      value={product.brand || ''}
                      onChange={(e) => updateField(product.id, 'brand', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter brand name"
                    />
                  </div>
                  <div>
                    <label htmlFor={`size-${product.id}`} className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                    <input
                      id={`size-${product.id}`}
                      type="text"
                      value={product.size || ''}
                      onChange={(e) => updateField(product.id, 'size', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., M, L, 32, 9"
                    />
                  </div>
                  <div>
                    <label htmlFor={`condition-${product.id}`} className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                    <select
                      id={`condition-${product.id}`}
                      value={product.conditionType || 'good'}
                      onChange={(e) => updateField(product.id, 'conditionType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      title="Select product condition"
                    >
                      <option value="new">New</option>
                      <option value="like_new">Like New</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={product.listed}
                        onChange={(e) => updateField(product.id, 'listed', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Listed (Visible to customers)</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label htmlFor={`description-${product.id}`} className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    id={`description-${product.id}`}
                    value={product.description || ''}
                    onChange={(e) => updateField(product.id, 'description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter product description"
                  />
                </div>

                <div>
                  <label htmlFor={`image-${product.id}`} className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    id={`image-${product.id}`}
                    type="url"
                    value={product.imageUrl || ''}
                    onChange={(e) => updateField(product.id, 'imageUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => cancelEdit(product.id)}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={saving === product.id}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => saveEdit(product)}
                    disabled={saving === product.id}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving === product.id ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium">{product.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        product.listed 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.listed ? 'Listed' : 'Unlisted'}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">{product.description}</p>
                  </div>
                  {product.imageUrl && (
                    <div className="ml-4">
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Price:</span>
                    <div className="font-medium">${product.price?.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Brand:</span>
                    <div className="font-medium">{product.brand || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Size:</span>
                    <div className="font-medium">{product.size || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Condition:</span>
                    <div className="font-medium capitalize">{product.conditionType?.replace('_', ' ') || 'Good'}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-xs text-gray-500">
                    Product ID: {product.id}
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => startEdit(product.id)}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No products found. Products will appear here once they are added.
        </div>
      )}
    </div>
  );
}
