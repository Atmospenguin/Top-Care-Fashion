"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import Image from "next/image";

type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  imageUrls?: string[];
  brand?: string;
  size?: string;
  conditionType?: string;
  tags?: string[];
  listed: boolean;
  sellerName?: string;
  categoryName?: string;
};

export default function MarketplacePage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const isAdmin = user?.actor === "Admin";

  const loadProducts = async () => {
    try {
      const endpoint = isAdmin ? "/api/admin/products" : "/api/listings";
      const res = await fetch(endpoint, { cache: "no-store" });
      const data = await res.json();
      setProducts(data.products || data.listings || []);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [isAdmin]);

  const toggleListing = async (productId: string, currentListed: boolean) => {
    if (!isAdmin) return;
    try {
      await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listed: !currentListed })
      });
      loadProducts();
    } catch (error) {
      console.error("Failed to toggle listing:", error);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!isAdmin) return;
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
      loadProducts();
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  };

  const saveProduct = async (product: Product) => {
    if (!isAdmin) return;
    try {
      const method = editingProduct?.id ? "PATCH" : "POST";
      const url = editingProduct?.id 
        ? `/api/admin/products/${editingProduct.id}` 
        : "/api/admin/products";
      
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product)
      });
      
      setEditingProduct(null);
      loadProducts();
    } catch (error) {
      console.error("Failed to save product:", error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-64">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Marketplace</h1>
        {isAdmin && (
          <button
            onClick={() => setEditingProduct({} as Product)}
            className="bg-[var(--brand-color)] text-white px-4 py-2 rounded-md hover:opacity-90"
          >
            Add Product
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="border border-black/10 rounded-lg overflow-hidden bg-white">
            <div className="aspect-square bg-gray-100 relative">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No Image
                </div>
              )}
              {isAdmin && (
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => toggleListing(product.id, product.listed)}
                    className={`px-2 py-1 text-xs rounded ${
                      product.listed 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {product.listed ? "Listed" : "Unlisted"}
                  </button>
                </div>
              )}
            </div>
            
            <div className="p-4">
              <h3 className="font-medium text-lg truncate">{product.name}</h3>
              <p className="text-gray-600 text-sm line-clamp-2 mt-1">{product.description}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xl font-semibold">${product.price?.toFixed(2) || "0.00"}</span>
                <button
                  onClick={() => setSelectedProduct(product)}
                  className="text-[var(--brand-color)] hover:underline text-sm"
                >
                  View Details
                </button>
              </div>
              
              {isAdmin && (
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <button
                    onClick={() => setEditingProduct(product)}
                    className="flex-1 bg-blue-600 text-white py-1 text-sm rounded hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="flex-1 bg-red-600 text-white py-1 text-sm rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No products found
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{selectedProduct.name}</h2>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="aspect-square bg-gray-100 rounded-lg relative">
                  {selectedProduct.imageUrl ? (
                    <Image
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No Image Available
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-700">Price</h3>
                    <p className="text-2xl font-semibold">${selectedProduct.price?.toFixed(2) || "0.00"}</p>
                  </div>
                  
                  {selectedProduct.brand && (
                    <div>
                      <h3 className="font-medium text-gray-700">Brand</h3>
                      <p>{selectedProduct.brand}</p>
                    </div>
                  )}
                  
                  {selectedProduct.size && (
                    <div>
                      <h3 className="font-medium text-gray-700">Size</h3>
                      <p>{selectedProduct.size}</p>
                    </div>
                  )}
                  
                  {selectedProduct.conditionType && (
                    <div>
                      <h3 className="font-medium text-gray-700">Condition</h3>
                      <p className="capitalize">{selectedProduct.conditionType.replace('_', ' ')}</p>
                    </div>
                  )}
                  
                  {selectedProduct.description && (
                    <div>
                      <h3 className="font-medium text-gray-700">Description</h3>
                      <p className="text-gray-600">{selectedProduct.description}</p>
                    </div>
                  )}
                  
                  {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-700">Tags</h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedProduct.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm"
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
          </div>
        </div>
      )}

      {/* Product Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {editingProduct.id ? "Edit Product" : "Add Product"}
                </h2>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const productData = {
                  name: formData.get("name") as string,
                  description: formData.get("description") as string,
                  price: Number(formData.get("price")),
                  imageUrl: formData.get("imageUrl") as string,
                  brand: formData.get("brand") as string,
                  size: formData.get("size") as string,
                  conditionType: formData.get("conditionType") as string,
                  tags: (formData.get("tags") as string)?.split(",").map(t => t.trim()).filter(Boolean) || [],
                  listed: formData.get("listed") === "on"
                };
                saveProduct({ ...editingProduct, ...productData });
              }} className="space-y-4">
                <div>
                  <label htmlFor="product-name" className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    id="product-name"
                    name="name"
                    type="text"
                    required
                    defaultValue={editingProduct.name || ""}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                
                <div>
                  <label htmlFor="product-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    id="product-description"
                    name="description"
                    rows={3}
                    defaultValue={editingProduct.description || ""}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="product-price" className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                    <input
                      id="product-price"
                      name="price"
                      type="number"
                      step="0.01"
                      required
                      defaultValue={editingProduct.price || ""}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="product-brand" className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                    <input
                      id="product-brand"
                      name="brand"
                      type="text"
                      defaultValue={editingProduct.brand || ""}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="product-size" className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                    <input
                      id="product-size"
                      name="size"
                      type="text"
                      defaultValue={editingProduct.size || ""}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="product-condition" className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                    <select
                      id="product-condition"
                      name="conditionType"
                      defaultValue={editingProduct.conditionType || "good"}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="new">New</option>
                      <option value="like_new">Like New</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="product-image" className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    id="product-image"
                    name="imageUrl"
                    type="url"
                    defaultValue={editingProduct.imageUrl || ""}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                
                <div>
                  <label htmlFor="product-tags" className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                  <input
                    id="product-tags"
                    name="tags"
                    type="text"
                    defaultValue={editingProduct.tags?.join(", ") || ""}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="vintage, summer, casual"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    id="product-listed"
                    name="listed"
                    type="checkbox"
                    defaultChecked={editingProduct.listed !== false}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="product-listed" className="ml-2 text-sm text-gray-700">Listed for sale</label>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-[var(--brand-color)] text-white py-2 rounded-md hover:opacity-90"
                  >
                    {editingProduct.id ? "Update Product" : "Create Product"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="flex-1 bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



