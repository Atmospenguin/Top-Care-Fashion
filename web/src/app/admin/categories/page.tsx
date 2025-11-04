"use client";

import { useEffect, useState } from "react";
import type { ListingCategory } from "@/types/admin";
import Link from "next/link";

interface ExtendedCategory extends ListingCategory {
  editing?: boolean;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ExtendedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [searchTerm, setSearchTerm] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/categories", { cache: "no-store" });
      const json = await res.json();
      setCategories((json.categories || []).map((c: ListingCategory) => ({ ...c, editing: false })));
    } catch (e: any) {
      setError(e.message || "Load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredCategories = categories.filter(category => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (
        !category.name?.toLowerCase().includes(searchLower) &&
        !category.description?.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }
    return true;
  });

  const startEdit = (id: string) => {
    setCategories(categories.map(cat => ({ 
      ...cat, 
      editing: cat.id === id ? true : false 
    })));
  };

  const cancelEdit = (id: string) => {
    setCategories(categories.map(cat => ({ 
      ...cat, 
      editing: cat.id === id ? false : cat.editing 
    })));
    load(); // Reload to reset changes
  };

  const saveEdit = async (category: ExtendedCategory) => {
    try {
      setSaving(category.id);
      const updateData = {
        name: category.name,
        description: category.description
      };

      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      });

      if (res.ok) {
        setCategories(categories.map(c => ({ 
          ...c, 
          editing: c.id === category.id ? false : c.editing 
        })));
        load();
      } else {
        console.error('Failed to save category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setSaving(null);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        load();
      } else {
        console.error('Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const createCategory = async () => {
    if (!newCategory.name.trim()) return;

    try {
      setCreating(true);
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCategory)
      });

      if (res.ok) {
        setNewCategory({ name: "", description: "" });
        load();
      } else {
        console.error('Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
    } finally {
      setCreating(false);
    }
  };

  const updateField = (id: string, field: keyof ListingCategory, value: any) => {
    setCategories(categories.map(category => 
      category.id === id ? { ...category, [field]: value } : category
    ));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Category Management</h2>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Category Management</h2>
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
        <h2 className="text-xl font-semibold">Category Management</h2>
        <div className="text-sm text-gray-600">
          {filteredCategories.length} of {categories.length} categories
        </div>
      </div>

      {/* Search Controls */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search categories by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Create New Category */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Create New Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="new-category-name" className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
            <input
              id="new-category-name"
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Accessories, Clothing, Shoes"
            />
          </div>
          <div>
            <label htmlFor="new-category-description" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <input
              id="new-category-description"
              type="text"
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of this category"
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={createCategory}
            disabled={!newCategory.name.trim() || creating}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Category'}
          </button>
        </div>
      </div>

      {/* Categories List */}
      <div className="grid gap-4">
        {filteredCategories.map((category) => (
          <div key={category.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            {category.editing ? (
              // Edit Mode
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={`name-${category.id}`} className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                    <input
                      id={`name-${category.id}`}
                      type="text"
                      value={category.name}
                      onChange={(e) => updateField(category.id, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter category name"
                    />
                  </div>
                  <div>
                    <label htmlFor={`description-${category.id}`} className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      id={`description-${category.id}`}
                      type="text"
                      value={category.description || ''}
                      onChange={(e) => updateField(category.id, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter description (optional)"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => cancelEdit(category.id)}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={saving === category.id}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => saveEdit(category)}
                    disabled={saving === category.id}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving === category.id ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">{category.name}</h3>
                    <p className="text-gray-600 mt-1">
                      {category.description || "No description provided"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Category ID:</span>
                    <div className="font-medium">{category.id}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <div className="font-medium">
                      {category.createdAt ? new Date(category.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <div className="font-medium text-green-600">Active</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    Products using this category will need to be recategorized if deleted
                  </div>
                  <div className="flex items-center space-x-3">
                    <Link
                      href={`/admin/listings?category=${category.id}`}
                      className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      View Listings
                    </Link>
                    <button
                      onClick={() => startEdit(category.id)}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteCategory(category.id)}
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

      {categories.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No categories found. Create your first category to organize products.
        </div>
      )}
    </div>
  );
}
