import { create } from 'zustand';
import axios from 'axios';
import io from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = API_URL.replace('/api', '');

let socket;

const useAnalyticsStore = create((set, get) => ({
  chartsData: {
    clicksOverTime: [],
    platformData: [],
    deviceData: [],
    osData: [],
    countryData: []
  },
  feed: [],
  topReels: [],
  topCategories: [],
  growthStats: { currentPeriod: 0, previousPeriod: 0, growthPercent: 0 },
  engagementStats: { totalReels: 0, totalClicks: 0, avgClicksPerReel: 0 },
  isLoading: false,

  initSocket: (userId, role) => {
    if (!socket) {
      socket = io(SOCKET_URL);
      
      socket.on('connect', () => {
        if (role === 'admin') {
          socket.emit('join_admin');
        } else {
          socket.emit('join', userId);
        }
      });

      socket.on('new_click', (clickData) => {
        // Prepend new click to feed
        set((state) => {
          const newFeed = [clickData, ...state.feed].slice(0, 50); // Keep last 50
          return { feed: newFeed };
        });
        
        // Refresh charts data silently when a new click happens
        get().fetchChartsData(true);
      });
    }
  },

  disconnectSocket: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  fetchChartsData: async (silent = false) => {
    if (!silent) set({ isLoading: true });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/analytics/charts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ chartsData: response.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch charts:', error);
      set({ isLoading: false });
    }
  },

  fetchFeed: async (limit = 50) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/analytics/feed?limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ feed: response.data });
    } catch (error) {
      console.error('Failed to fetch feed:', error);
      set({ feed: [] });
    }
  },

  fetchTopData: async () => {
    try {
      const token = localStorage.getItem('token');
      const [reelsRes, catRes] = await Promise.all([
        axios.get(`${API_URL}/analytics/top-reels`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/analytics/top-categories`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      set({ topReels: reelsRes.data, topCategories: catRes.data });
    } catch (error) {
      console.error('Failed to fetch top data:', error);
      set({ topReels: [], topCategories: [] });
    }
  },

  fetchGrowthAndEngagement: async () => {
    try {
      const token = localStorage.getItem('token');
      const [growthRes, engagementRes] = await Promise.all([
        axios.get(`${API_URL}/analytics/growth`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/analytics/engagement`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      set({ growthStats: growthRes.data, engagementStats: engagementRes.data });
    } catch (error) {
      console.error('Failed to fetch growth/engagement:', error);
    }
  }
}));

export default useAnalyticsStore;
