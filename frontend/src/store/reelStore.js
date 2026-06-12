import { create } from 'zustand';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const useReelStore = create((set, get) => ({
  reels: [],
  campaigns: [],
  isLoading: false,
  isGenerating: false,

  fetchReels: async (params = {}) => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/reels`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ reels: Array.isArray(response.data) ? response.data : [], isLoading: false });
    } catch (error) {
      set({ reels: [], isLoading: false });
      toast.error(error.response?.data?.error || 'Failed to fetch reels history');
    }
  },

  generateReel: async (theme, customization = {}, duration = 10, category = '', bgType = 'pixabay', customImagePath = null, storyContent = null, articleId = null) => {
    set({ isGenerating: true });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/reels/generate`, { theme, customization, duration, category, bgType, customImagePath, storyContent, articleId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(response.data.message || 'Reel generation started!');
      
      // Refresh the list immediately to show the queued reel
      await get().fetchReels();
      
      return response.data;
    } catch (error) {
      set({ isGenerating: false });
      toast.error(error.response?.data?.error || 'Failed to start reel generation');
      return null;
    } finally {
      set({ isGenerating: false });
    }
  },

  fetchCampaigns: async () => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/reels/campaigns`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ campaigns: Array.isArray(response.data) ? response.data : [], isLoading: false });
    } catch (error) {
      set({ campaigns: [], isLoading: false });
      toast.error(error.response?.data?.error || 'Failed to fetch short links');
    }
  },

  downloadReel: async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/reels/${id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob', // Important for downloading files
      });
      
      // Create a URL for the blob and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reel-${id}.mp4`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download reel');
    }
  },

  deleteReel: async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/reels/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set((state) => ({
        reels: state.reels.filter((r) => r.id !== id),
        campaigns: state.campaigns.filter((c) => c.id !== id)
      }));
      toast.success('Reel deleted successfully');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete reel');
      return false;
    }
  }
}));

export default useReelStore;
