import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Articles() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [articles, setArticles] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/admin/articles?page=${page}&limit=20&search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setArticles(res.data?.articles || []);
      setTotal(res.data?.total || 0);
    } catch (e) {
      toast.error('Failed to load articles');
      setArticles([]);
      setTotal(0);
    }
    setLoading(false);
  };

  useEffect(() => { fetchArticles(); }, [page, search]);

  const deleteArticle = async (id) => {
    if (!confirm('Delete this article?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/admin/articles/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Deleted');
      fetchArticles();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to delete article');
    }
  };

  const isCooldown = (until) => until && new Date(until) > new Date();

  return (
    <div className="p-6 text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Article Pool
          <span className="ml-3 bg-purple-600 text-white text-sm px-3 py-1 rounded-full">{total} total</span>
        </h1>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search articles..."
          className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-sm w-64 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : (!articles || articles.length === 0) ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-xl mb-2">No articles yet</p>
          <p className="text-sm">Go to Website Sources and click "Scrape All Sources"</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700 text-left">
                <th className="py-3 pr-4">Title</th>
                <th className="py-3 pr-4">Category</th>
                <th className="py-3 pr-4">Content Preview</th>
                <th className="py-3 pr-4">Uses</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Date</th>
                {isAdmin && <th className="py-3">Action</th>}
              </tr>
            </thead>
            <tbody>
              {articles.map(a => (
                <tr key={a.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 pr-4 max-w-xs">
                    <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline line-clamp-2">{a.title}</a>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="bg-gray-700 px-2 py-1 rounded text-xs">{a.source_category || 'general'}</span>
                  </td>
                  <td className="py-3 pr-4 text-gray-400 text-xs max-w-xs">{a.content_preview || 'No content'}</td>
                  <td className="py-3 pr-4 text-center">{a.usage_count || 0}</td>
                  <td className="py-3 pr-4">
                    {isCooldown(a.on_cooldown_until)
                      ? <span className="bg-yellow-900/50 text-yellow-300 border border-yellow-800/30 px-2 py-1 rounded text-xs">⏳ Cooldown</span>
                      : <span className="bg-green-900/50 text-green-300 border border-green-800/30 px-2 py-1 rounded text-xs">✅ Available</span>
                    }
                  </td>
                  <td className="py-3 pr-4 text-gray-400 text-xs">
                    {a.created_at ? new Date(a.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  {isAdmin && (
                    <td className="py-3">
                      <button onClick={() => deleteArticle(a.id)} className="text-red-400 hover:text-red-300 text-xs">🗑️ Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between items-center mt-6">
            <span className="text-gray-400 text-sm">Showing {articles?.length || 0} of {total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="px-3 py-1 bg-gray-700 hover:bg-gray-650 rounded disabled:opacity-40 text-sm transition">← Prev</button>
              <span className="px-3 py-1 text-sm">Page {page}</span>
              <button onClick={() => setPage(p => p+1)} disabled={!articles || articles.length < 20} className="px-3 py-1 bg-gray-700 hover:bg-gray-650 rounded disabled:opacity-40 text-sm transition">Next →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
