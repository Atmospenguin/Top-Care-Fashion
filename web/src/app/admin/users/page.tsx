"use client";

import { useEffect, useState } from "react";
import type { UserAccount } from "@/types/admin";

interface ExtendedUser extends UserAccount {
  editing?: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      const json = await res.json();
      setUsers((json.users || []).map((u: UserAccount) => ({ ...u, editing: false })));
    } catch (e: any) {
      setError(e.message || "Load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (id: string) => {
    setUsers(users.map(user => ({ 
      ...user, 
      editing: user.id === id ? true : false 
    })));
  };

  const cancelEdit = (id: string) => {
    setUsers(users.map(user => ({ 
      ...user, 
      editing: user.id === id ? false : user.editing 
    })));
    load(); // Reload to reset changes
  };

  const saveEdit = async (user: ExtendedUser) => {
    try {
      setSaving(user.id);
      const updateData = {
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        is_premium: user.is_premium
      };

      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      });

      if (res.ok) {
        setUsers(users.map(u => ({ 
          ...u, 
          editing: u.id === user.id ? false : u.editing 
        })));
        load();
      } else {
        console.error('Failed to save user');
      }
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setSaving(null);
    }
  };

  const toggleStatus = async (user: ExtendedUser) => {
    try {
      const newStatus = user.status === "active" ? "suspended" : "active";
      await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      load();
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const updateField = (id: string, field: keyof UserAccount, value: any) => {
    setUsers(users.map(user => 
      user.id === id ? { ...user, [field]: value } : user
    ));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">User Management</h2>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">User Management</h2>
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
        <h2 className="text-xl font-semibold">User Management</h2>
        <div className="text-sm text-gray-600">
          {users.length} users total • {users.filter(u => u.status === 'active').length} active
        </div>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            {user.editing ? (
              // Edit Mode
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={`username-${user.id}`} className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                      id={`username-${user.id}`}
                      type="text"
                      value={user.username}
                      onChange={(e) => updateField(user.id, 'username', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <label htmlFor={`email-${user.id}`} className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      id={`email-${user.id}`}
                      type="email"
                      value={user.email}
                      onChange={(e) => updateField(user.id, 'email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label htmlFor={`role-${user.id}`} className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      id={`role-${user.id}`}
                      value={user.role}
                      onChange={(e) => updateField(user.id, 'role', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="User">User</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`status-${user.id}`} className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      id={`status-${user.id}`}
                      value={user.status}
                      onChange={(e) => updateField(user.id, 'status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={user.is_premium}
                      onChange={(e) => updateField(user.id, 'is_premium', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Premium Member</span>
                  </label>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => cancelEdit(user.id)}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={saving === user.id}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => saveEdit(user)}
                    disabled={saving === user.id}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving === user.id ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium">{user.username}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === 'Admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                      {user.is_premium && (
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                          Premium
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-1">{user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">User ID:</span>
                    <div className="font-medium">{user.id}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <div className="font-medium">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Premium Until:</span>
                    <div className="font-medium">
                      {user.premium_until ? new Date(user.premium_until).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Account Type:</span>
                    <div className="font-medium">
                      {user.is_premium ? 'Premium' : 'Free'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View Details
                  </button>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => startEdit(user.id)}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleStatus(user)}
                      className={`px-3 py-1.5 text-sm rounded-md ${
                        user.status === 'active'
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {user.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No users found. Users will appear here once they register.
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-lg p-6 w-[min(90vw,500px)] max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">User Details</h3>
              <button 
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-700">User ID:</span>
                  <div>{selectedUser.id}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Username:</span>
                  <div>{selectedUser.username}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <div>{selectedUser.email}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Role:</span>
                  <div>{selectedUser.role}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <div className="capitalize">{selectedUser.status}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Premium:</span>
                  <div>{selectedUser.is_premium ? 'Yes' : 'No'}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created:</span>
                  <div>{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : 'N/A'}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Premium Until:</span>
                  <div>{selectedUser.premium_until ? new Date(selectedUser.premium_until).toLocaleString() : 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
