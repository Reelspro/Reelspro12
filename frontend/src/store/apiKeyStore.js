import { create } from 'zustand';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const useApiKeyStore = create((set) => ({
  apiKeys: [],
  isLoading: false,

  fetchApiKeys: async () => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/keys`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ apiKeys: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      toast.error(error.response?.data?.error || 'Failed to fetch API keys');
    }
  },

  addApiKey: async (provider, api_key) => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/keys`, { provider, api_key }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // We don't get the full key back for security, but we get the metadata.
      // Refresh the list to reflect changes
      await useApiKeyStore.getState().fetchApiKeys();
      
      toast.success(response.data.message || 'API key saved successfully');
      return true;
    } catch (error) {
      set({ isLoading: false });
      toast.error(error.response?.data?.error || 'Failed to add API key');
      return false;
    }
  },

  deleteApiKey: async (id) => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/keys/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set(state => ({
        apiKeys: state.apiKeys.filter(k => k.id !== id),
        isLoading: false
      }));
      toast.success('API key deleted');
      return true;
    } catch (error) {
      set({ isLoading: false });
      toast.error(error.response?.data?.error || 'Failed to delete API key');
      return false;
    }
  }
}));

export default useApiKeyStore;
