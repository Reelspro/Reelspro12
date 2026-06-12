import { create } from 'zustand';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const useAdminStore = create((set, get) => ({
  overview: {
    totals: { users: 0, activeUsers: 0, reels: 0, clicks: 0, downloads: 0, campaigns: 0, apis: 0 },
    recentUsers: [],
    topUsers: []
  },
  advancedAnalytics: {
    topReels: [],
    topCategories: [],
    topWebsites: [],
    topTrafficSources: [],
    clicksOverTime: [],
  },
  queueStats: [],
  logs: [],
  usersData: { users: [], total: 0, page: 1, pages: 1 },
  pendingUsers: [],
  pendingCount: 0,
  currentUserDetail: null,
  systemSettings: {
    daily_reel_limit: 50,
    auto_approve_users: false,
    default_ai_provider: 'groq',
    platform_name: 'ReelsPro Ultimate',
    maintenance_mode: false,
    article_cooldown_minutes: 30,
  },
  isLoading: false,

  fetchOverview: async () => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ overview: response.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch admin overview:', error);
      set({ isLoading: false });
    }
  },

  fetchAdvancedAnalytics: async () => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ advancedAnalytics: response.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch advanced analytics:', error);
      set({ isLoading: false });
    }
  },

  fetchQueueStats: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/queues`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ queueStats: response.data });
    } catch (error) {
      console.error('Failed to fetch queue stats:', error);
      toast.error('Failed to fetch queue stats');
    }
  },

  exportAnalytics: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/analytics/export`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reelspro-analytics-${Date.now()}.json`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Analytics exported');
    } catch (error) {
      toast.error('Failed to export analytics');
    }
  },

  fetchLogs: async (limit = 100) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/logs?limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ logs: response.data });
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  },

  fetchPendingUsers: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/users?status=pending&limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const users = response.data?.users || [];
      set({ pendingUsers: users, pendingCount: users.length });
    } catch (error) {
      console.error('Failed to fetch pending users:', error);
    }
  },

  approvePendingUser: async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/admin/users/${id}/status`, { status: 'approved' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User approved successfully!');
      // Refresh pending list
      get().fetchPendingUsers();
      get().fetchOverview();
      return true;
    } catch (error) {
      toast.error('Failed to approve user');
      return false;
    }
  },

  rejectPendingUser: async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/admin/users/${id}/status`, { status: 'rejected' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User rejected.');
      get().fetchPendingUsers();
      get().fetchOverview();
      return true;
    } catch (error) {
      toast.error('Failed to reject user');
      return false;
    }
  },

  fetchUsers: async (page = 1, status = '', search = '') => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('token');
      let url = `${API_URL}/admin/users?page=${page}&limit=10`;
      if (status) url += `&status=${status}`;
      if (search) url += `&search=${search}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ usersData: response.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to fetch users');
      set({ isLoading: false });
    }
  },

  fetchUserDetail: async (id) => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ currentUserDetail: response.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      toast.error('Failed to fetch user details');
      set({ isLoading: false });
    }
  },

  updateUserStatus: async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/admin/users/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`User status updated to ${status}`);
      // Refresh current data
      const { page } = get().usersData;
      get().fetchUsers(page);
      if (get().currentUserDetail?.user.id === id) {
        get().fetchUserDetail(id);
      }
      return true;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update user status');
      return false;
    }
  },

  updateUserRole: async (id, role) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/admin/users/${id}/role`, { role }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`User role updated to ${role}`);
      const { page } = get().usersData;
      get().fetchUsers(page);
      if (get().currentUserDetail?.user.id === id) {
        get().fetchUserDetail(id);
      }
      return true;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update user role');
      return false;
    }
  },

  deleteUser: async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User deleted successfully');
      const { page } = get().usersData;
      get().fetchUsers(page);
      return true;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete user');
      return false;
    }
  },

  fetchSystemSettings: async () => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ systemSettings: response.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Failed to fetch settings');
      set({ isLoading: false });
    }
  },

  updateSystemSettings: async (settings) => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/admin/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ systemSettings: response.data, isLoading: false });
      toast.success('System settings updated successfully');
      return true;
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('Failed to update settings');
      set({ isLoading: false });
      return false;
    }
  }
}));

export default useAdminStore;
