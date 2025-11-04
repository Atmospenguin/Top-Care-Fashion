"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { UserAccount } from "@/types/admin";

interface ExtendedUser extends UserAccount {
  editing?: boolean;
}

type FilterType = "all" | "active" | "suspended" | "premium" | "admin";
type SortOption =
  | "created-desc"
  | "created-asc"
  | "name-asc"
  | "name-desc"
  | "status"
  | "role"
  | "premium";

const AVATAR_SIZE_CLASSES: Record<number, string> = {
  48: "h-12 w-12",
  56: "h-14 w-14",
  64: "h-16 w-16",
  72: "h-[72px] w-[72px]",
};

export default function UsersPage() {
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("created-desc");

  const AvatarCircle = ({
    name,
    url,
    size = 48,
  }: {
    name?: string | null;
    url?: string | null;
    size?: number;
  }) => {
    const initials = (name || "?").trim().charAt(0).toUpperCase() || "?";
    const sizeClass = AVATAR_SIZE_CLASSES[size] ?? AVATAR_SIZE_CLASSES[48];
    return (
      <span className={`inline-flex items-center justify-center rounded-full bg-gray-200 text-gray-600 font-semibold border border-gray-200 overflow-hidden ${sizeClass}`}>
        {url ? (
          <img
            src={url}
            alt={name || "User avatar"}
            className="w-full h-full object-cover"
            onError={(e) => {
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent) {
                parent.textContent = initials;
                parent.classList.remove("overflow-hidden");
              }
            }}
          />
        ) : (
          initials
        )}
      </span>
    );
  };

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

  const filteredUsers = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return users.filter((user) => {
      if (filter !== "all") {
        switch (filter) {
          case "active":
            if (user.status !== "active") return false;
            break;
          case "suspended":
            if (user.status !== "suspended") return false;
            break;
          case "premium":
            if (!user.is_premium) return false;
            break;
          case "admin":
            if (user.role !== "Admin") return false;
            break;
        }
      }

      if (normalized) {
        const matched = [user.username, user.email, user.role]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalized));
        if (!matched) return false;
      }

      return true;
    });
  }, [users, filter, searchTerm]);

  const sortedUsers = useMemo(() => {
    const list = [...filteredUsers];
    switch (sortOption) {
      case "name-asc":
        list.sort((a, b) => (a.username || "").localeCompare(b.username || ""));
        break;
      case "name-desc":
        list.sort((a, b) => (b.username || "").localeCompare(a.username || ""));
        break;
      case "created-asc":
        list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "status":
        list.sort((a, b) => a.status.localeCompare(b.status));
        break;
      case "role":
        list.sort((a, b) => a.role.localeCompare(b.role));
        break;
      case "premium":
        list.sort((a, b) => Number(b.is_premium) - Number(a.is_premium));
        break;
      case "created-desc":
      default:
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }
    return list;
  }, [filteredUsers, sortOption]);

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
          {sortedUsers.length} of {users.length} users • {users.filter(u => u.status === 'active').length} active
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search users by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            aria-label="Filter users"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="premium">Premium</option>
            <option value="admin">Admins</option>
          </select>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            aria-label="Sort users"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="created-desc">Newest first</option>
            <option value="created-asc">Oldest first</option>
            <option value="name-asc">Name A → Z</option>
            <option value="name-desc">Name Z → A</option>
            <option value="status">Status</option>
            <option value="role">Role</option>
            <option value="premium">Premium first</option>
          </select>
          {(searchTerm || filter !== "all" || sortOption !== "created-desc") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setFilter("all");
                setSortOption("created-desc");
              }}
              className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {sortedUsers.map((user) => (
          <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            {user.editing ? (
              // Edit Mode
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <AvatarCircle name={user.username} url={user.avatar_url} size={64} />
                  <div>
                    <div className="text-base font-semibold text-gray-900">{user.username}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
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
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <AvatarCircle name={user.username} url={user.avatar_url} size={64} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-medium text-gray-900 truncate">{user.username}</h3>
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
                      <p className="text-gray-600 mt-2 break-all">{user.email}</p>
                    </div>
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
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View Details
                  </Link>
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

      {sortedUsers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {users.length === 0
            ? "No users found. Users will appear here once they register."
            : "No users match the current filters."}
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
              <div className="flex items-center gap-3">
                <AvatarCircle name={selectedUser.username} url={selectedUser.avatar_url} size={56} />
                <div>
                  <div className="text-base font-semibold text-gray-900">{selectedUser.username}</div>
                  <div className="text-xs text-gray-500 break-all">{selectedUser.email}</div>
                </div>
              </div>
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
