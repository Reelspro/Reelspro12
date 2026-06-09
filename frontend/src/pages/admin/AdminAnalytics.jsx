import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAdminStore from '../../store/adminStore';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { BarChart3, ArrowLeft, Download, Globe, TrendingUp } from 'lucide-react';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function AdminAnalytics() {
  const { advancedAnalytics, fetchAdvancedAnalytics, exportAnalytics, isLoading } = useAdminStore();
  const { topReels, topCategories, topWebsites, topTrafficSources, clicksOverTime } = advancedAnalytics;

  useEffect(() => {
    fetchAdvancedAnalytics();
  }, [fetchAdvancedAnalytics]);

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen text-white">
      <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="text-blue-400" />
            Global Analytics
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Platform-wide traffic, categories, and website performance.</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={exportAnalytics} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm">
            <Download size={16} /> Export JSON
          </button>
          <Link to="/admin/dashboard" className="text-gray-400 hover:text-white flex items-center gap-2 text-sm">
            <ArrowLeft size={16} /> Admin
          </Link>
        </div>
      </div>

      {isLoading && clicksOverTime.length === 0 ? (
        <p className="text-gray-500 text-center py-12">Loading analytics...</p>
      ) : (
        <div className="space-y-8">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-purple-400" /> Clicks Over Time
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={clicksOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                  <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <h2 className="text-lg font-bold mb-4">Top Traffic Sources</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={topTrafficSources} dataKey="count" nameKey="platform" cx="50%" cy="50%" outerRadius={80} stroke="none">
                      {topTrafficSources.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <h2 className="text-lg font-bold mb-4">Top Categories</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCategories}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="category" stroke="#9ca3af" fontSize={11} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                    <Bar dataKey="total_clicks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-700"><h2 className="font-bold">Top Reels</h2></div>
              <table className="w-full text-sm text-gray-400">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left">Title</th>
                    <th className="px-6 py-3 text-right">Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {topReels.map((r) => (
                    <tr key={r.id} className="border-t border-gray-700/50">
                      <td className="px-6 py-3 text-white truncate max-w-xs">{r.article_title}</td>
                      <td className="px-6 py-3 text-right text-green-400">{r.total_clicks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-700 flex items-center gap-2">
                <Globe size={18} className="text-green-400" />
                <h2 className="font-bold">Top Website Sources</h2>
              </div>
              <table className="w-full text-sm text-gray-400">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left">Source</th>
                    <th className="px-6 py-3 text-right">Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {topWebsites.map((w, i) => (
                    <tr key={i} className="border-t border-gray-700/50">
                      <td className="px-6 py-3 text-white truncate max-w-xs">{w.category_name || w.url}</td>
                      <td className="px-6 py-3 text-right text-green-400">{w.total_clicks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



