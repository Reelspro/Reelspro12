import { create } from 'zustand';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let initialUser = null;
try {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    initialUser = JSON.parse(storedUser);
  }
} catch (e) {
  console.error('Failed to parse stored user:', e);
  localStorage.removeItem('user');
}

const useAuthStore = create((set, get) => ({
  user: initialUser,
  token: localStorage.getItem('token') || null,
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token, ...userData } = response.data;
      
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);
      
      set({ user: userData, token, isLoading: false });
      toast.success('Logged in successfully!');
      return true;
    } catch (error) {
      set({ isLoading: false });
      toast.error(error.response?.data?.error || 'Failed to login');
      return false;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true });
    try {
      const response = await axios.post(`${API_URL}/auth/register`, { name, email, password });
      const { token, ...userData } = response.data;
      
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);
      
      set({ user: userData, token, isLoading: false });
      toast.success('Registration successful! Please wait for admin approval if required.');
      return true;
    } catch (error) {
      set({ isLoading: false });
      toast.error(error.response?.data?.error || 'Failed to register');
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
    toast.success('Logged out');
  }
}));

export default useAuthStore;
