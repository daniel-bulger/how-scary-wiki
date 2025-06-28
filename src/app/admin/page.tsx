'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Shield, User, AlertCircle, Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface DbUser {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
  _count: {
    ratings: number;
    reviews: number;
    moderatorLogs: number;
  };
}

interface UserListResponse {
  users: DbUser[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<DbUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1
  });
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user, page, search, roleFilter]);

  const fetchUsers = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter })
      });
      
      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch users');
      }
      
      const data: UserListResponse = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'USER' | 'MODERATOR' | 'ADMIN') => {
    if (!user) return;
    
    setUpdatingUserId(userId);
    
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, role: newRole })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user role');
      }
      
      // Refresh the user list
      await fetchUsers();
    } catch (err) {
      console.error('Failed to update user role:', err);
      alert(err instanceof Error ? err.message : 'Failed to update user role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-600" />
          <div>
            <h2 className="text-lg font-semibold text-red-900">Access Denied</h2>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage users and their roles
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">All Roles</option>
            <option value="USER">Users</option>
            <option value="MODERATOR">Moderators</option>
            <option value="ADMIN">Admins</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((dbUser) => (
                <tr key={dbUser.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {dbUser.name || 'Unnamed User'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {dbUser.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      dbUser.role === 'ADMIN' 
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        : dbUser.role === 'MODERATOR'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {dbUser.role === 'ADMIN' && <Shield className="h-3 w-3 mr-1" />}
                      {dbUser.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div>
                      {dbUser._count.ratings} ratings
                    </div>
                    <div>
                      {dbUser._count.reviews} reviews
                    </div>
                    {dbUser._count.moderatorLogs > 0 && (
                      <div className="text-blue-600 dark:text-blue-400">
                        {dbUser._count.moderatorLogs} mod actions
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(dbUser.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <select
                      value={dbUser.role}
                      onChange={(e) => updateUserRole(dbUser.id, e.target.value as any)}
                      disabled={updatingUserId === dbUser.id}
                      className="text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
                    >
                      <option value="USER">User</option>
                      <option value="MODERATOR">Moderator</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
              disabled={page === pagination.totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing{' '}
                <span className="font-medium">{(page - 1) * pagination.limit + 1}</span>
                {' '}to{' '}
                <span className="font-medium">
                  {Math.min(page * pagination.limit, pagination.total)}
                </span>
                {' '}of{' '}
                <span className="font-medium">{pagination.total}</span>
                {' '}results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Page {page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                  disabled={page === pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}