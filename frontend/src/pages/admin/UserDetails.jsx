import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useAdminStore from '../../store/adminStore';
import { ArrowLeft, User, ShieldAlert, Activity, Video, MousePointerClick, Calendar, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const STATIC_URL = API_URL.replace('/api', '/output');

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUserDetail, fetchUserDetail, updateUserStatus, deleteUser, isLoading } = useAdminStore();

  useEffect(() => {
    fetchUserDetail(id);
  }, [id, fetchUserDetail]);

  if (isLoading || !currentUserDetail) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400">
        <Activity className="animate-spin mr-2" /> Loading user data...
      </div>
    );
  }

  const {
    user, reels, clicksByPlatform, clicksByCountry, clicksByDevice,
    clicksOverTime, topCategories, latestClicks, activityLogs,
  } = currentUserDetail;

  const handleStatusChange = async (status) => {
    await updateUserStatus(user.id, status);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this user entirely? This cannot be undone.')) {
      const success = await deleteUser(user.id);
      if (success) navigate('/admin/users');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link to="/admin/users" className="p-2 hover:bg-gray-800 rounded-lg transition">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <User className="text-blue-500" />
              {user.name}
            </h1>
            <p className="text-gray-400 mt-1">{user.email}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {user.status !== 'approved' && (
            <button onClick={() => handleStatusChange('approved')} className="flex items-center gap-2 bg-green-600/20 text-green-400 hover:bg-green-600/30 px-4 py-2 rounded font-medium transition">
              <CheckCircle size={18} /> Approve
            </button>
          )}
          {user.status !== 'suspended' && (
            <button onClick={() => handleStatusChange('suspended')} className="flex items-center gap-2 bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30 px-4 py-2 rounded font-medium transition">
              <XCircle size={18} /> Suspend
            </button>
          )}
          <button onClick={handleDelete} className="flex items-center gap-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 px-4 py-2 rounded font-medium transition border border-red-500/20 hover:border-red-500/50">
            <Trash2 size={18} /> Delete User
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Overview & Stats */}
        <div className="space-y-8">
          
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-gray-700 pb-2">
              <Activity className="text-purple-500" /> Profile Overview
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Role</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-red-900/50 text-red-300' : 'bg-blue-900/50 text-blue-300'}`}>
                  {user.role.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Status</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                  user.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {user.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Joined</span>
                <span className="text-gray-200 flex items-center gap-1 text-sm">
                  <Calendar size={14} className="text-gray-500"/> {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Last Active</span>
                <span className="text-gray-200 text-sm">
                  {user.last_activity ? formatDistanceToNow(new Date(user.last_activity), { addSuffix: true }) : 'Never'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
              <Video className="mx-auto text-purple-400 mb-2" size={24} />
              <p className="text-2xl font-bold">{user.reels_generated}</p>
              <p className="text-xs text-gray-400">Total Reels</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
              <MousePointerClick className="mx-auto text-green-400 mb-2" size={24} />
              <p className="text-2xl font-bold">{user.clicks}</p>
              <p className="text-xs text-gray-400">Total Clicks</p>
            </div>
          </div>

          {clicksOverTime && clicksOverTime.length > 0 && (
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
              <h2 className="text-lg font-bold mb-4">Clicks Over Time</h2>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={clicksOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} />
                    <YAxis stroke="#9ca3af" fontSize={10} />
                    <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {clicksByPlatform && clicksByPlatform.length > 0 && (
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
              <h2 className="text-lg font-bold mb-4">Traffic Sources</h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={clicksByPlatform}
                      cx="50%" cy="50%"
                      innerRadius={40} outerRadius={70}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="platform"
                      stroke="none"
                    >
                      {clicksByPlatform.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }}
                      itemStyle={{ color: '#e5e7eb' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {clicksByPlatform.map((p, i) => (
                  <span key={p.platform} className="text-xs flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></span>
                    {p.platform}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(clicksByCountry?.length > 0 || clicksByDevice?.length > 0) && (
            <div className="grid grid-cols-2 gap-4">
              {clicksByCountry?.length > 0 && (
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                  <h3 className="text-sm font-bold mb-3">Top Countries</h3>
                  {clicksByCountry.slice(0, 5).map((c) => (
                    <div key={c.country} className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{c.country}</span>
                      <span className="text-green-400">{c.count}</span>
                    </div>
                  ))}
                </div>
              )}
              {clicksByDevice?.length > 0 && (
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                  <h3 className="text-sm font-bold mb-3">Devices</h3>
                  {clicksByDevice.map((d) => (
                    <div key={d.device} className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{d.device}</span>
                      <span className="text-blue-400">{d.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {topCategories?.length > 0 && (
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
              <h3 className="text-sm font-bold mb-3">Top Categories</h3>
              {topCategories.map((cat) => (
                <div key={cat.category} className="flex justify-between text-xs text-gray-400 mb-1 capitalize">
                  <span>{cat.category}</span>
                  <span>{cat.total_clicks} clicks</span>
                </div>
              ))}
            </div>
          )}

          {latestClicks?.length > 0 && (
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
              <h3 className="text-sm font-bold mb-3">Latest Clicks</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {latestClicks.map((click) => (
                  <div key={click.id} className="text-xs text-gray-400 border-l-2 border-purple-500 pl-2">
                    <p className="text-gray-200 truncate">{click.article_title}</p>
                    <p>{click.platform} • {formatDistanceToNow(new Date(click.created_at), { addSuffix: true })}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activityLogs?.length > 0 && (
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
              <h3 className="text-sm font-bold mb-3">Activity Logs</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {activityLogs.map((log) => (
                  <div key={log.id} className="text-xs text-gray-400">
                    <span className="text-purple-400 font-mono">{log.action}</span>
                    <span className="mx-1">•</span>
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Col: Recent Content */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl overflow-hidden h-full">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Video className="text-blue-400" /> Recent Generated Content
              </h2>
            </div>
            
            <div className="p-0">
              {reels.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Video size={48} className="mx-auto opacity-20 mb-4" />
                  <p>This user hasn't generated any reels yet.</p>
                </div>
              ) : (
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-gray-900/50 text-gray-400 text-sm">
                    <tr>
                      <th className="px-6 py-3 font-medium">Reel Context</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Short Link</th>
                      <th className="px-6 py-3 font-medium text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {reels.map(reel => (
                      <tr key={reel.id} className="hover:bg-gray-750 transition text-sm">
                        <td className="px-6 py-4 truncate max-w-xs text-gray-200" title={reel.article_title}>
                          {reel.article_title || 'Unknown Source'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            reel.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            reel.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {reel.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-purple-400">
                          {reel.short_url ? `/${reel.short_url}` : '-'}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-400">
                          {formatDistanceToNow(new Date(reel.created_at), { addSuffix: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UserDetails;
