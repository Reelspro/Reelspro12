import { create } from 'zustand';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const useSourceStore = create((set, get) => ({
  sources: [],
  isLoading: false,

  fetchSources: async () => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/sources`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ sources: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      toast.error(error.response?.data?.error || 'Failed to fetch sources');
    }
  },

  addSource: async (sourceData) => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/sources`, sourceData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ sources: [response.data], isLoading: false });
      toast.success('Source added successfully');
      return true;
    } catch (error) {
      set({ isLoading: false });
      toast.error(error.response?.data?.error || 'Failed to add source');
      return false;
    }
  },

  updateSource: async (id, sourceData) => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/sources/${id}`, sourceData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set(state => ({
        sources: state.sources.map(s => s.id === id ? { ...s, ...sourceData } : s),
        isLoading: false
      }));
      toast.success('Source updated');
      return true;
    } catch (error) {
      set({ isLoading: false });
      toast.error(error.response?.data?.error || 'Failed to update source');
      return false;
    }
  },

  deleteSource: async (id) => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/sources/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set(state => ({
        sources: state.sources.filter(s => s.id !== id),
        isLoading: false
      }));
      toast.success('Source deleted');
      return true;
    } catch (error) {
      set({ isLoading: false });
      toast.error(error.response?.data?.error || 'Failed to delete source');
      return false;
    }
  }
}));

export default useSourceStore;
