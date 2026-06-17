import React, { useState } from 'react';
import useAuthStore from '../store/authStore';
import { User, Mail, Shield, KeyRound, LogOut, Settings as SettingsIcon } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, logout } = useAuthStore();
  const [isChanging, setIsChanging] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long!");
      return;
    }

    setIsSubmitting(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/auth/update-password`, {
        currentPassword,
        newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Password changed successfully!");
      setIsChanging(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-700">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <SettingsIcon className="text-purple-500" />
              Account Settings
            </h1>
            <p className="text-gray-400 mt-2">Manage your account preferences and security.</p>
          </div>
          <button 
            onClick={logout}
            className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-700 bg-gray-800/50">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <User className="text-blue-400" /> Profile Information
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{user?.name}</h3>
                  <p className="text-gray-400 flex items-center gap-2">
                    <Mail size={14} /> {user?.email}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                <div className="bg-gray-700/30 p-4 rounded-lg">
                  <p className="text-sm text-gray-400 flex items-center gap-2 mb-1">
                    <Shield size={14} /> Account Role
                  </p>
                  <p className="font-medium capitalize text-blue-400">{user?.role}</p>
                </div>
                <div className="bg-gray-700/30 p-4 rounded-lg">
                  <p className="text-sm text-gray-400 flex items-center gap-2 mb-1">
                    <User size={14} /> Account Status
                  </p>
                  <p className="font-medium capitalize text-green-400">{user?.status}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-700 bg-gray-800/50">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <KeyRound className="text-orange-400" /> Security
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold mb-1">Change Password</h3>
                  <p className="text-sm text-gray-400">Update your account password to stay secure.</p>
                </div>
                {!isChanging && (
                  <button 
                    onClick={() => setIsChanging(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition"
                  >
                    Change Password
                  </button>
                )}
              </div>

              {isChanging && (
                <form onSubmit={handlePasswordChange} className="space-y-4 mt-6 border-t border-gray-700 pt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Current Password</label>
                    <input 
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">New Password</label>
                    <input 
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Confirm New Password</label>
                    <input 
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <button 
                      type="button"
                      onClick={() => {
                        setIsChanging(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition text-sm font-medium flex items-center gap-2"
                    >
                      {isSubmitting ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;
