import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAnalyticsStore from '../../store/analyticsStore';
import useAuthStore from '../../store/authStore';
import { Activity, ArrowLeft, Globe, Smartphone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AdminLiveClicks() {
  const { feed, fetchFeed, initSocket, disconnectSocket } = useAnalyticsStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchFeed(100);
    if (user) initSocket(user.id, user.role);
    const interval = setInterval(() => fetchFeed(100), 15000);
    return () => {
      clearInterval(interval);
      disconnectSocket();
    };
  }, [fetchFeed, initSocket, disconnectSocket, user]);

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen text-white">
      <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <Activity className="text-red-400" />
            Live Click Feed
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Real-time global traffic with user, platform, and device data.</p>
        </div>
        <Link to="/admin/dashboard" className="text-gray-400 hover:text-white flex items-center gap-2 text-sm">
          <ArrowLeft size={16} /> Admin
        </Link>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-700/50 text-gray-300">
            <tr>
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Content</th>
              <th className="px-6 py-3">Platform</th>
              <th className="px-6 py-3">Location</th>
              <th className="px-6 py-3">Device</th>
              <th className="px-6 py-3 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="text-gray-400 divide-y divide-gray-700/50">
            {feed.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">Waiting for clicks...</td>
              </tr>
            ) : (
              feed.map((click) => (
                <tr key={click.id} className="hover:bg-gray-700/20">
                  <td className="px-6 py-4">
                    <p className="text-white font-medium">{click.user_name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{click.user_email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs truncate text-white font-medium" title={click.article_title}>
                      {click.article_title}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">{click.source_category || '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-blue-400 text-xs font-semibold">{click.platform}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-white">
                      <Globe size={14} className="text-orange-400" /> 
                      {click.country} {click.city && click.city !== 'Unknown' ? `(${click.city})` : ''}
                    </div>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">IP: {click.ip_address || 'Unknown'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-white">
                      <Smartphone size={14} className="text-green-400" /> {click.device}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{click.os} • {click.browser}</div>
                  </td>
                  <td className="px-6 py-4 text-right text-xs">
                    {formatDistanceToNow(new Date(click.created_at), { addSuffix: true })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
