import React, { useEffect, useState } from 'react';
import { Key, Shield, Trash2, Plus } from 'lucide-react';
import useApiKeyStore from '../store/apiKeyStore';
import useAuthStore from '../store/authStore';

const PROVIDERS = [
  { id: 'groq', name: 'Groq (llama3-70b)' },
  { id: 'gemini', name: 'Google Gemini' },
  { id: 'qwen', name: 'Alibaba Qwen' },
  { id: 'openrouter', name: 'OpenRouter' },
  { id: 'huggingface', name: 'HuggingFace' },
  { id: 'canva_business', name: 'Canva Business API (Unlimited Cloud)' },
  { id: 'canva_free', name: 'Canva Free Preset Cloud' },
  { id: 'capcut_api', name: 'CapCut Enterprise API (TikTok Native)' },
  { id: 'capcut_free', name: 'CapCut Free Preset Automation' }
];

const ApiKeys = () => {
  const { user } = useAuthStore();
  const { apiKeys, fetchApiKeys, addApiKey, deleteApiKey, isLoading } = useApiKeyStore();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ provider: 'groq', api_key: '' });

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await addApiKey(formData.provider, formData.api_key);
    if (success) {
      setShowModal(false);
      setFormData({ provider: 'groq', api_key: '' });
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Key className="text-yellow-500" />
            {user?.role === 'admin' ? 'System API Keys' : 'My API Keys'}
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            {user?.role === 'admin' 
              ? 'Manage global API keys. These are used as fallback if sub-users do not provide their own.'
              : 'Add your own API keys for generation. System keys will be used if you don\'t provide these.'}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 px-4 py-2 rounded font-medium transition"
        >
          <Plus size={20} /> Add Key
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
        <table className="w-full text-left">
          <thead className="bg-gray-900 border-b border-gray-700">
            <tr>
              <th className="p-4 text-gray-300 font-semibold">Provider</th>
              <th className="p-4 text-gray-300 font-semibold">Type</th>
              <th className="p-4 text-gray-300 font-semibold">Status</th>
              <th className="p-4 text-gray-300 font-semibold">Date Added</th>
              <th className="p-4 text-gray-300 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {apiKeys.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-500">
                  No API keys configured.
                </td>
              </tr>
            ) : (
              apiKeys.map(key => (
                <tr key={key.id} className="border-b border-gray-700 hover:bg-gray-750 transition">
                  <td className="p-4 font-medium capitalize flex items-center gap-2">
                    {key.provider}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${key.type === 'system' || key.type === 'admin' ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}>
                      {key.type === 'system' || key.type === 'admin' ? <Shield size={12} /> : <Key size={12} />}
                      {key.type}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-green-400">
                    Active & Encrypted
                  </td>
                  <td className="p-4 text-sm text-gray-400">
                    {new Date(key.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => { if(window.confirm('Delete this key?')) deleteApiKey(key.id); }}
                      className="p-2 text-red-400 hover:bg-red-900/30 rounded transition"
                      title="Delete Key"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-xl font-bold">Configure API Key</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">AI Provider</label>
                <select
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  {PROVIDERS.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">API Key</label>
                <input
                  type="password"
                  required
                  placeholder="Paste your API key here..."
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Keys are encrypted using AES-256-CBC before saving to the database.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium transition disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeys;
