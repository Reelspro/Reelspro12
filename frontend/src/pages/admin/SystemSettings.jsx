import React, { useEffect, useState } from 'react';
import { Settings, Shield, Server, Check, Save, Zap } from 'lucide-react';
import useAdminStore from '../../store/adminStore';

const SystemSettings = () => {
  const { systemSettings, fetchSystemSettings, updateSystemSettings, isLoading } = useAdminStore();
  
  const [formData, setFormData] = useState({
    daily_reel_limit: 50,
    auto_approve_users: false,
    default_ai_provider: 'groq',
    platform_name: 'ReelsPro Ultimate',
    maintenance_mode: false,
    article_cooldown_minutes: 30,
  });

  useEffect(() => {
    fetchSystemSettings();
  }, [fetchSystemSettings]);

  useEffect(() => {
    if (systemSettings) {
      setFormData(systemSettings);
    }
  }, [systemSettings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateSystemSettings(formData);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto text-white">
      <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="text-purple-500" />
            System Settings
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Configure global platform limits, defaults, and operations.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Basic Settings */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-gray-700 pb-2">
            <Server className="text-blue-400" /> Platform Configuration
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Platform Name</label>
              <input
                type="text"
                name="platform_name"
                value={formData.platform_name || ''}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Displayed across the dashboard and emails.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Default AI Provider</label>
              <select
                name="default_ai_provider"
                value={formData.default_ai_provider || 'groq'}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="groq">Groq (llama3-70b)</option>
                <option value="gemini">Google Gemini</option>
                <option value="qwen">Alibaba Qwen</option>
                <option value="openrouter">OpenRouter</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Fallback provider used if a user hasn't set their own API key.</p>
            </div>
          </div>
        </div>

        {/* User & Generation Limits */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-gray-700 pb-2">
            <Shield className="text-green-400" /> Quotas & Access
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Daily Reel Limit (Per User)</label>
              <input
                type="number"
                name="daily_reel_limit"
                value={formData.daily_reel_limit || 0}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum number of reels a standard user can generate in 24 hours.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Article Cooldown (minutes)</label>
              <input
                type="number"
                name="article_cooldown_minutes"
                min={1}
                value={formData.article_cooldown_minutes ?? 30}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">How long before the same article can be assigned again.</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-700/30 border border-gray-600 rounded-lg">
              <div>
                <h3 className="font-bold">Auto-Approve New Users</h3>
                <p className="text-sm text-gray-400">If enabled, new signups will bypass the pending state.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="auto_approve_users"
                  checked={formData.auto_approve_users || false}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* App Updates Configuration */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-gray-700 pb-2">
            <Zap className="text-purple-400" /> App Updates Management
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-700/30 border border-gray-600 rounded-lg">
              <div>
                <h3 className="font-bold">Enable Update Notification</h3>
                <p className="text-sm text-gray-400">If enabled, all users will see a notification to update to the specified version.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="update_available"
                  checked={formData.update_available || false}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Target Version</label>
                <input
                  type="text"
                  name="update_version"
                  placeholder="e.g. 1.3.1"
                  value={formData.update_version || ''}
                  onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Installer Download URL</label>
                <input
                  type="text"
                  name="update_url"
                  placeholder="e.g. https://domain.com/installer.exe"
                  value={formData.update_url || ''}
                  onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Changelog (One feature per line)</label>
              <textarea
                name="update_changelog"
                rows={4}
                placeholder="- Added new background colors&#10;- Fixed rendering speed&#10;- Fixed highlight tags bug"
                value={formData.update_changelog || ''}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-red-950/20 border border-red-900/30 rounded-lg">
              <div>
                <h3 className="font-bold text-red-400">Force Update</h3>
                <p className="text-sm text-gray-400">Lock user dashboards and force them to download the update.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="force_update"
                  checked={formData.force_update || false}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-gray-800 p-6 rounded-xl border border-red-900/50 shadow-xl">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-gray-700 pb-2 text-red-400">
            <Zap className="text-red-500" /> Danger Zone
          </h2>
          
          <div className="flex items-center justify-between p-4 bg-red-900/20 border border-red-900/30 rounded-lg">
            <div>
              <h3 className="font-bold text-red-400">Maintenance Mode</h3>
              <p className="text-sm text-gray-400">Disable reel generation and scraping for all non-admin users.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="maintenance_mode"
                checked={formData.maintenance_mode || false}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-bold transition disabled:opacity-50"
          >
            <Save size={20} />
            {isLoading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default SystemSettings;
