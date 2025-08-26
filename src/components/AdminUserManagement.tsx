import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Shield, 
  UserCheck, 
  UserX,
  Key,
  MoreHorizontal
} from 'lucide-react';

interface AdminUser {
  _id: string;
  userId: {
    _id: string;
    email: string;
    fullName: string;
  };
  role: 'super_admin' | 'admin' | 'viewer';
  permissions: {
    profiles: { view: boolean; approve: boolean; reject: boolean; export: boolean };
    reminders: { view: boolean; send: boolean; cancel: boolean; configure: boolean };
    users: { view: boolean; block: boolean; unblock: boolean };
    admins: { view: boolean; create: boolean; update: boolean; delete: boolean };
    analytics: { view: boolean; export: boolean };
    system: { config: boolean; logs: boolean };
  };
  isActive: boolean;
  lastLogin?: string;
  loginCount: number;
  createdBy?: {
    _id: string;
    email: string;
    fullName: string;
  };
  notes?: string;
  createdAt: string;
}

interface AdminStats {
  roleStats: Array<{
    _id: string;
    count: number;
    activeCount: number;
  }>;
  totalAdmins: number;
  activeAdmins: number;
  recentLogins: number;
}

const AdminUserManagement: React.FC = () => {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [filters, setFilters] = useState({
    role: '',
    isActive: ''
  });

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchAdminUsers();
    fetchStats();
  }, [currentPage, filters]);

  useEffect(() => {
    console.log('adminUsers state changed:', adminUsers);
  }, [adminUsers]);

  const fetchAdminUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      console.log('Token from localStorage:', token ? token.substring(0, 50) + '...' : 'No token');
      
      // If no token, redirect to login
      if (!token) {
        console.log('No token found, redirecting to login...');
        window.location.href = '/login';
        return;
      }
      
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...filters
      });

      console.log('Fetching admin users with params:', queryParams.toString());
      console.log('API URL:', `${API_BASE_URL}/admin-users?${queryParams}`);

      const response = await fetch(`${API_BASE_URL}/admin-users?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('Admin users data received:', data);
        console.log('Admin users array:', data.adminUsers);
        console.log('Admin users count:', data.adminUsers?.length);
        
        setAdminUsers(data.adminUsers || []);
        setTotalPages(data.totalPages || 1);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        
        // If it's an authentication error, clear the token
        if (response.status === 401 || response.status === 403) {
          console.log('Authentication error detected, clearing token...');
          localStorage.removeItem('authToken');
          // Redirect to login or show login prompt
          window.location.href = '/login';
        }
      }
    } catch (error) {
      console.error('Error fetching admin users:', error);
    } finally {
      setLoading(false);
    }
  };



  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/admin-users/stats/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateAdmin = async (formData: any) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/admin-users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowCreateModal(false);
        fetchAdminUsers();
        fetchStats();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      alert('Failed to create admin user');
    }
  };

  const handleUpdateAdmin = async (adminId: string, formData: any) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/admin-users/${adminId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedAdmin(null);
        fetchAdminUsers();
        fetchStats();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating admin:', error);
      alert('Failed to update admin user');
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to delete this admin user?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/admin-users/${adminId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchAdminUsers();
        fetchStats();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      alert('Failed to delete admin user');
    }
  };

  const handleUpdatePassword = async (adminId: string, password: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/admin-users/${adminId}/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        setShowPasswordModal(false);
        setSelectedAdmin(null);
        alert('Password updated successfully');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating password:', error);
      alert('Failed to update password');
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      super_admin: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      viewer: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[role as keyof typeof colors]}`}>
        {role.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <UserCheck className="w-3 h-3 mr-1" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <UserX className="w-3 h-3 mr-1" />
        Inactive
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin User Management</h2>
          <p className="text-gray-600">Manage admin users and their permissions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Admin
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Admins</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAdmins}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Admins</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeAdmins}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Logins</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recentLogins}</p>
              </div>
              <Shield className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Super Admins</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.roleStats.find(s => s._id === 'super_admin')?.count || 0}
                </p>
              </div>
              <Shield className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.isActive}
              onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Admin Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Admin Users</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
                         <tbody className="bg-white divide-y divide-gray-200">
               {(() => { console.log('Rendering admin users:', adminUsers); return null; })()}
               {adminUsers && adminUsers.length > 0 ? (
                 adminUsers.map((admin) => (
                   <tr key={admin._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {admin.userId.fullName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {admin.userId.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(admin.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(admin.isActive)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {admin.lastLogin ? formatDate(admin.lastLogin) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(admin.createdAt)}
                  </td>
                                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                     <div className="flex items-center space-x-2">
                       <button
                         onClick={() => {
                           setSelectedAdmin(admin);
                           setShowEditModal(true);
                         }}
                         className="text-blue-600 hover:text-blue-900"
                       >
                         <Edit className="w-4 h-4" />
                       </button>
                       <button
                         onClick={() => {
                           setSelectedAdmin(admin);
                           setShowPasswordModal(true);
                         }}
                         className="text-yellow-600 hover:text-yellow-900"
                       >
                         <Key className="w-4 h-4" />
                       </button>
                       <button
                         onClick={() => handleDeleteAdmin(admin._id)}
                         className="text-red-600 hover:text-red-900"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                     </div>
                   </td>
                 </tr>
               ))
             ) : (
               <tr>
                 <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                   No admin users found
                 </td>
               </tr>
             )}
             </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <CreateAdminModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateAdmin}
        />
      )}

      {/* Edit Admin Modal */}
      {showEditModal && selectedAdmin && (
        <EditAdminModal
          admin={selectedAdmin}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAdmin(null);
          }}
          onSubmit={handleUpdateAdmin}
        />
      )}

      {/* Password Modal */}
      {showPasswordModal && selectedAdmin && (
        <PasswordModal
          admin={selectedAdmin}
          onClose={() => {
            setShowPasswordModal(false);
            setSelectedAdmin(null);
          }}
          onSubmit={handleUpdatePassword}
        />
      )}
    </div>
  );
};

// Modal Components
const CreateAdminModal: React.FC<{ onClose: () => void; onSubmit: (data: any) => void }> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'admin',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Create New Admin</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditAdminModal: React.FC<{ admin: AdminUser; onClose: () => void; onSubmit: (adminId: string, data: any) => void }> = ({ admin, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    role: admin.role,
    isActive: admin.isActive,
    notes: admin.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(admin._id, formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Edit Admin User</h3>
        <div className="mb-4">
          <p className="text-sm text-gray-600">{admin.userId.email}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PasswordModal: React.FC<{ admin: AdminUser; onClose: () => void; onSubmit: (adminId: string, password: string) => void }> = ({ admin, onClose, onSubmit }) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(admin._id, password);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Update Password</h3>
        <div className="mb-4">
          <p className="text-sm text-gray-600">{admin.userId.email}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUserManagement;
