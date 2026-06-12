import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, Filter, ShieldAlert, MoreVertical, Trash2, Shield, Eye, CheckCircle, XCircle, Plus, Clock, UserCheck } from 'lucide-react';
import useAdminStore from '../../store/adminStore';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const UserManagement = () => {
  const { usersData, fetchUsers, updateUserStatus, updateUserRole, deleteUser, isLoading } = useAdminStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserData, setNewUserData] = useState({ name: '', email: '', password: '' });

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      await axios.post(`${API_URL}/auth/register`, newUserData);
      toast.success('User added successfully! They are pending approval.');
      setShowAddUser(false);
      setNewUserData({ name: '', email: '', password: '' });
      fetchUsers(page, statusFilter, searchTerm);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add user');
    }
  };

  useEffect(() => {
    fetchUsers(page, statusFilter, searchTerm);
  }, [fetchUsers, page, statusFilter, searchTerm]);

  const handleStatusChange = async (id, status) => {
    await updateUserStatus(id, status);
    setActionMenuOpen(null);
  };

  const handleRoleChange = async (id, role) => {
    if (window.confirm(`Are you sure you want to change this user's role to ${role}?`)) {
      await updateUserRole(id, role);
    }
    setActionMenuOpen(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you absolutely sure you want to delete this user? This will also delete all their reels and data.')) {
      await deleteUser(id);
    }
    setActionMenuOpen(null);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="text-blue-500" />
            User Management
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Approve, manage roles, or suspend user accounts across the platform.</p>
        </div>
        <button 
          onClick={() => setShowAddUser(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition"
        >
          <Plus size={20} /> Add User
        </button>
      </div>

      {/* Quick Status Filter Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { label: 'All Users', value: '', icon: Users },
          { label: 'Pending', value: 'pending', icon: Clock },
          { label: 'Approved', value: 'approved', icon: UserCheck },
          { label: 'Suspended', value: 'suspended', icon: XCircle },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              statusFilter === tab.value
                ? tab.value === 'pending' ? 'bg-amber-500 text-black' :
                  tab.value === 'approved' ? 'bg-green-600 text-white' :
                  tab.value === 'suspended' ? 'bg-red-600 text-white' :
                  'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-gray-500" size={18} />
          </div>
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 text-white"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
        </div>
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="text-gray-500" size={18} />
          </div>
          <select
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 text-white appearance-none"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-visible">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-900 border-b border-gray-700 text-gray-300 text-sm">
              <tr>
                <th className="p-4 font-semibold">User Details</th>
                <th className="p-4 font-semibold">Role & Status</th>
                <th className="p-4 font-semibold">Reels & Downloads</th>
                <th className="p-4 font-semibold">Campaigns & Clicks</th>
                <th className="p-4 font-semibold">Activity Timeline</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 text-sm">
              {usersData.users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    {isLoading ? 'Loading users...' : 'No users found matching your criteria.'}
                  </td>
                </tr>
              ) : (
                usersData.users.map(user => {
                  const lastActiveDistance = user.last_activity
                    ? formatDistanceToNow(new Date(user.last_activity), { addSuffix: true })
                    : 'Never active';

                  return (
                    <tr key={user.id} className="hover:bg-gray-750/30 transition">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            {user.name}
                            <span className="text-[9px] bg-gray-900 border border-gray-700 text-gray-400 font-mono px-1 rounded">
                              ID: {user.id}
                            </span>
                          </span>
                          <span className="text-xs text-gray-400">{user.email}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            user.role === 'admin' ? 'bg-red-900/40 text-red-300 border border-red-800/30' : 'bg-blue-900/40 text-blue-300 border border-blue-800/30'
                          }`}>
                            {user.role === 'admin' && <ShieldAlert size={12} />}
                            {user.role.toUpperCase()}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            user.status === 'approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            user.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                            'bg-red-500/10 text-red-400 border border-red-500/20'
                          } border`}>
                            {user.status.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col text-xs text-gray-300">
                          <span>🎬 Generated: <strong className="text-purple-400 font-semibold">{user.reels_generated || 0}</strong></span>
                          <span>💾 Downloads: <strong className="text-purple-300 font-semibold">{user.reel_downloads || 0}</strong></span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col text-xs text-gray-300">
                          <span>📣 Campaigns: <strong className="text-green-400 font-semibold">{user.campaigns || 0}</strong></span>
                          <span>🖱️ Clicks: <strong className="text-green-300 font-semibold">{user.clicks || 0}</strong></span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col text-xs text-gray-400">
                          <span>📅 Joined: <strong className="text-gray-300 font-semibold">{new Date(user.created_at).toLocaleDateString()}</strong></span>
                          <span>⚡ Active: <strong className="text-gray-300 font-semibold">{lastActiveDistance}</strong></span>
                        </div>
                      </td>
                      <td className="p-4 text-right relative">
                      <button 
                        onClick={() => setActionMenuOpen(actionMenuOpen === user.id ? null : user.id)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition"
                      >
                        <MoreVertical size={20} className="text-gray-400" />
                      </button>

                      {/* Dropdown Menu */}
                      {actionMenuOpen === user.id && (
                        <>
                          {/* Backdrop to close menu */}
                          <div className="fixed inset-0 z-10" onClick={() => setActionMenuOpen(null)}></div>
                          
                          <div className="absolute right-8 top-10 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-20 overflow-hidden py-1">
                            <Link 
                              to={`/admin/users/${user.id}`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 w-full text-left"
                            >
                              <Eye size={16} className="text-blue-400"/> View Details
                            </Link>
                            
                            <div className="border-t border-gray-700 my-1"></div>
                            
                            {user.status !== 'approved' && (
                              <button 
                                onClick={() => handleStatusChange(user.id, 'approved')}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 w-full text-left"
                              >
                                <CheckCircle size={16} className="text-green-400"/> Approve User
                              </button>
                            )}
                            
                            {user.status !== 'suspended' && (
                              <button 
                                onClick={() => handleStatusChange(user.id, 'suspended')}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 w-full text-left"
                              >
                                <XCircle size={16} className="text-yellow-400"/> Suspend User
                              </button>
                            )}

                            <div className="border-t border-gray-700 my-1"></div>

                            {user.role === 'user' ? (
                              <button 
                                onClick={() => handleRoleChange(user.id, 'admin')}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 w-full text-left"
                              >
                                <Shield size={16} className="text-red-400"/> Make Admin
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleRoleChange(user.id, 'user')}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 w-full text-left"
                              >
                                <Shield size={16} className="text-blue-400"/> Remove Admin
                              </button>
                            )}

                            <div className="border-t border-gray-700 my-1"></div>

                            <button 
                              onClick={() => handleDelete(user.id)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-700 w-full text-left"
                            >
                              <Trash2 size={16} /> Delete Account
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {usersData.pages > 1 && (
          <div className="p-4 border-t border-gray-700 flex justify-between items-center bg-gray-800">
            <span className="text-sm text-gray-400">
              Showing page {usersData.page} of {usersData.pages} ({usersData.total} total)
            </span>
            <div className="flex gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded text-sm transition"
              >
                Previous
              </button>
              <button 
                disabled={page === usersData.pages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded text-sm transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Add New User</h3>
              <button onClick={() => setShowAddUser(false)} className="text-gray-400 hover:text-white">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserData.name}
                  onChange={e => setNewUserData({...newUserData, name: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserData.email}
                  onChange={e => setNewUserData({...newUserData, email: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newUserData.password}
                  onChange={e => setNewUserData({...newUserData, password: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
