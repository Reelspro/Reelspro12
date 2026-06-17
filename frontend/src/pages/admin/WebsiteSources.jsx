import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Link as LinkIcon, ShieldAlert, X, HelpCircle, Globe } from 'lucide-react';
import useSourceStore from '../../store/sourceStore';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const WebsiteSources = () => {
  const { sources, fetchSources, addSource, updateSource, deleteSource, isLoading } = useSourceStore();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    type: 'website',
    url: '',
    category_name: ''
  });

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  // All sources are now treated as websites
  const websiteSources = sources.filter(s => s.type === 'website');

  const handleSubmit = async (e) => {
    e.preventDefault();
    let success = false;
    
    // Ensure type is always website
    const submitData = { ...formData, type: 'website' };
    
    if (editId) {
      success = await updateSource(editId, submitData);
    } else {
      success = await addSource(submitData);
    }

    if (success) {
      setShowModal(false);
      setEditId(null);
      setFormData({ type: 'website', url: '', category_name: '' });
    }
  };

  const handleEditClick = (source) => {
    setEditId(source.id);
    setFormData({
      type: 'website',
      url: source.url,
      category_name: source.category_name || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (source) => {
    const message = `Are you sure you want to delete this Website Source?\n\nURL: ${source.url}\n\nWARNING: Deleting this source will automatically remove all crawled articles, reels, render jobs, and click stats associated with it. This action cannot be undone.`;
    
    if (window.confirm(message)) {
      await deleteSource(source.id);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditId(null);
    setFormData({ type: 'website', url: '', category_name: '' });
  };

  const openAddModal = () => {
    setEditId(null);
    setFormData({
      type: 'website',
      url: '',
      category_name: ''
    });
    setShowModal(true);
  };

  return (
    <div className="p-8 min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-gray-700 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3 bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            <ShieldAlert size={36} className="text-blue-500" /> 
            Admin Website Sources
          </h1>
          <p className="text-gray-400 mt-2 text-sm max-w-2xl">
            Configure global website sources for article crawling. Add domains and manually assign category tags to automatically catalog scraped stories for video generation.
          </p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <button
            onClick={async () => {
              try {
                const token = localStorage.getItem('token');
                await axios.post(`${API_URL}/admin/scrape/all`, {}, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Scraping all sources started!');
              } catch (err) {
                toast.error(err.response?.data?.error || 'Failed to start scraping');
              }
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            🔄 Scrape All Sources
          </button>
          <button
            onClick={openAddModal}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20 text-white flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus size={20} /> Add Website Source
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mb-6 bg-blue-950/20 border border-blue-900/50 p-4 rounded-xl text-sm text-blue-300 flex items-start gap-3">
        <HelpCircle size={20} className="flex-shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold block mb-0.5 text-blue-200">How Website Sources Work:</strong>
          Our crawling engine automatically visits these domains, scrapes the latest articles, and tags them with your manually specified categories. When users customize reels, they can select one of these categories to shuffle and generate stories exclusively from that topic.
        </div>
      </div>

      {/* Websites Table Container */}
      <div className="bg-gray-800/80 backdrop-blur-md rounded-xl shadow-xl overflow-hidden border border-gray-700">
        <table className="w-full text-left">
          <thead className="bg-gray-900 border-b border-gray-700 text-gray-300">
            <tr>
              <th className="p-4 font-semibold">Website Name / URL</th>
              <th className="p-4 font-semibold">Assigned Categories</th>
              <th className="p-4 font-semibold">Articles Scraped</th>
              <th className="p-4 font-semibold">Last Crawl</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/60">
            {websiteSources.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-12 text-center text-gray-500 font-medium">
                  No website sources configured yet. Click "Add Website Source" to get started!
                </td>
              </tr>
            ) : (
              websiteSources.map(source => (
                <tr key={source.id} className="hover:bg-gray-750/30 transition">
                  <td className="p-4 text-sm font-medium text-gray-200">
                    <div className="flex items-center gap-2">
                      <LinkIcon size={16} className="text-blue-400 flex-shrink-0" />
                      <span className="truncate max-w-md" title={source.url}>{source.url}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm">
                    {source.category_name ? (
                      <div className="flex flex-wrap gap-1.5">
                        {source.category_name.split(',').map((cat, idx) => (
                          <span key={idx} className="bg-purple-900/40 text-purple-300 border border-purple-800/50 px-2.5 py-0.5 rounded-full text-2xs font-semibold uppercase">
                            {cat.trim()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500 italic text-xs">Uncategorized (General)</span>
                    )}
                  </td>
                  <td className="p-4 text-sm font-semibold text-blue-400">
                    {source.article_count || 0} articles
                  </td>
                  <td className="p-4 text-sm text-gray-400">
                    {source.last_scraped ? new Date(source.last_scraped).toLocaleString() : 'Never scraped'}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end items-center gap-1.5">
                      <button
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem('token');
                            await axios.post(`${API_URL}/admin/scrape/${source.id}`, {}, {
                              headers: { Authorization: `Bearer ${token}` }
                            });
                            toast.success(`Scraping ${source.url} started!`);
                          } catch (err) {
                            toast.error(err.response?.data?.error || `Failed to scrape ${source.url}`);
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                      >
                        🔄 Scrape Now
                      </button>
                      <button
                        onClick={() => handleEditClick(source)}
                        className="p-2 text-blue-400 hover:bg-blue-900/30 hover:text-blue-300 rounded-lg transition"
                        title="Edit Website URL / Categories"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(source)}
                        className="p-2 text-red-400 hover:bg-red-900/30 hover:text-red-300 rounded-lg transition"
                        title="Delete Website & Content"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-700 overflow-hidden transform transition-all scale-100">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-850">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Globe className="text-blue-400" size={22} />
                  {editId ? '📝 Edit' : '➕ Add'} Website Source
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {editId ? 'Update website address and assigned category tags.' : 'Register a new domain to pull article story content.'}
                </p>
              </div>
              <button onClick={handleCloseModal} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Website URL / RSS Feed Address
                </label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-white placeholder-gray-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Manual Categories (Comma Separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. crime, horror, suspense, emotional"
                  value={formData.category_name}
                  onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-white placeholder-gray-600 transition"
                />
                <p className="text-2xs text-gray-500 mt-1.5">
                  Manually define categories for this site. You can add multiple categories separated by commas (e.g. <code>crime, horror</code>).
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-700 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/40 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg font-semibold shadow-lg text-white transition shadow-blue-500/10 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : editId ? 'Update Website' : 'Save Website'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebsiteSources;
