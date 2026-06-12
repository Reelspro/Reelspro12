import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAdminStore from '../../store/adminStore';
import useAnalyticsStore from '../../store/analyticsStore';
import { Users, Globe, Key, Settings, Activity, Database, ShieldAlert, Video, BarChart3, FileText, Layers, Link2, Download, Clock, CheckCircle, XCircle, UserCheck } from 'lucide-react';

const AdminStatCard = ({ icon: Icon, title, value, color }) => (
  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl flex items-center gap-4">
    <div className={`p-4 rounded-lg bg-${color}-500/20 text-${color}-400`}>
      <Icon size={32} />
    </div>
    <div>
      <p className="text-gray-400 text-sm font-medium">{title}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  </div>
);

const AdminModuleCard = ({ title, description, link, icon: Icon, color }) => (
  <Link to={link} className="block group">
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl hover:border-gray-500 transition h-full">
      <div className={`w-12 h-12 rounded-lg bg-${color}-500/20 text-${color}-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
      <h3 className="text-xl font-bold text-gray-200 mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  </Link>
);

const AdminDashboard = () => {
  const { overview, fetchOverview, logs, fetchLogs, pendingUsers, pendingCount, fetchPendingUsers, approvePendingUser, rejectPendingUser } = useAdminStore();
  const { feed } = useAnalyticsStore(); // Global feed because admin joined 'admin' socket room

  useEffect(() => {
    fetchOverview();
    fetchLogs();
    fetchPendingUsers();
  }, [fetchOverview, fetchLogs, fetchPendingUsers]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-8 pb-4 border-b border-gray-700">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShieldAlert className="text-red-500" />
            Master Admin Dashboard
          </h1>
          <p className="text-gray-400 mt-2">Global system overview and module management.</p>
        </div>

        {/* Global Totals */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <AdminStatCard icon={Users} title="Total Users" value={overview.totals.users} color="blue" />
          <AdminStatCard icon={Users} title="Active Users" value={overview.totals.activeUsers || 0} color="cyan" />
          <AdminStatCard icon={Video} title="Global Reels" value={overview.totals.reels} color="purple" />
          <AdminStatCard icon={Activity} title="Global Clicks" value={overview.totals.clicks} color="green" />
          <AdminStatCard icon={Download} title="Downloads" value={overview.totals.downloads || 0} color="blue" />
          <AdminStatCard icon={Link2} title="Campaigns" value={overview.totals.campaigns || 0} color="orange" />
        </div>

        {/* Pending Approvals Widget */}
        {pendingCount > 0 && (
          <div className="mb-8 bg-amber-950/30 border border-amber-500/25 rounded-2xl overflow-hidden shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-amber-500/15">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
                  <Clock size={18} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2">
                    Pending Approvals
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-black text-xs font-bold">{pendingCount}</span>
                  </h3>
                  <p className="text-xs text-amber-400/70">These users are waiting for your review</p>
                </div>
              </div>
              <Link
                to="/admin/users?status=pending"
                className="text-xs text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-400/50 px-3 py-1.5 rounded-lg transition"
              >
                View all →
              </Link>
            </div>
            <div className="divide-y divide-amber-500/10">
              {pendingUsers.slice(0, 5).map(u => (
                <div key={u.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-amber-500/5 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center text-sm font-bold text-gray-300">
                      {(u.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 mr-2">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : ''}
                    </span>
                    <button
                      onClick={() => approvePendingUser(u.id)}
                      title="Approve"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600/20 hover:bg-green-600/40 border border-green-500/30 hover:border-green-500/60 text-green-400 hover:text-green-300 text-xs font-medium transition"
                    >
                      <CheckCircle size={13} /> Approve
                    </button>
                    <button
                      onClick={() => rejectPendingUser(u.id)}
                      title="Reject"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/30 border border-red-500/20 hover:border-red-500/50 text-red-400 hover:text-red-300 text-xs font-medium transition"
                    >
                      <XCircle size={13} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Management Modules Grid */}
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Database size={20} className="text-gray-400" /> System Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AdminModuleCard 
            title="User Management" 
            description="Approve, reject, or suspend sub-users." 
            link="/admin/users" 
            icon={Users} color="blue" 
          />
          <AdminModuleCard 
            title="Website Sources" 
            description="Manage global RSS and website scraping targets." 
            link="/admin/sources" 
            icon={Globe} color="green" 
          />
          <AdminModuleCard 
            title="Article Pool" 
            description="View, search, or delete scraped website stories." 
            link="/admin/articles" 
            icon={FileText} color="purple" 
          />
          <AdminModuleCard 
            title="API Keys" 
            description="Rotate or update global AI provider keys." 
            link="/keys" 
            icon={Key} color="orange" 
          />
          <AdminModuleCard 
            title="Global Analytics" 
            description="Top reels, categories, websites, and traffic sources." 
            link="/admin/analytics" 
            icon={BarChart3} color="blue" 
          />
          <AdminModuleCard 
            title="Live Clicks" 
            description="Real-time global click feed with user details." 
            link="/admin/live-clicks" 
            icon={Activity} color="red" 
          />
          <AdminModuleCard 
            title="Activity Logs" 
            description="Audit trail of platform actions." 
            link="/admin/logs" 
            icon={FileText} color="orange" 
          />
          <AdminModuleCard 
            title="Queue Monitor" 
            description="BullMQ scraping and render queue status." 
            link="/admin/queues" 
            icon={Layers} color="cyan" 
          />
          <AdminModuleCard 
            title="System Settings" 
            description="Configure global app behavior and limits." 
            link="/admin/settings" 
            icon={Settings} color="purple" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top Users & Recent Users */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
              <div className="p-6 border-b border-gray-700">
                <h3 className="font-bold text-lg">Top Active Users</h3>
              </div>
              <div className="p-0">
                <table className="w-full text-left text-sm text-gray-400">
                  <thead className="bg-gray-700/50 text-gray-300">
                    <tr>
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Reels Generated</th>
                      <th className="px-6 py-3">Total Clicks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(overview?.topUsers || []).map((u, i) => (
                      <tr key={i} className="border-b border-gray-700/50 bg-gray-800">
                        <td className="px-6 py-4 font-medium text-white">{u.name}</td>
                        <td className="px-6 py-4 text-purple-400">{u.reels_generated}</td>
                        <td className="px-6 py-4 text-green-400">{u.clicks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
              <div className="p-6 border-b border-gray-700">
                <h3 className="font-bold text-lg">Recently Registered</h3>
              </div>
              <div className="p-0">
                <table className="w-full text-left text-sm text-gray-400">
                  <thead className="bg-gray-700/50 text-gray-300">
                    <tr>
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(overview?.recentUsers || []).map((u, i) => (
                      <tr key={i} className="border-b border-gray-700/50 bg-gray-800">
                        <td className="px-6 py-4 font-medium text-white">{u.name}</td>
                        <td className="px-6 py-4">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs ${u.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {u.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Global Live Feed */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div> Global Live Clicks
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {(feed || []).slice(0, 10).map(click => (
                <div key={click.id} className="text-sm bg-gray-700/30 p-3 rounded border border-gray-700">
                  <p className="text-white truncate">{click.article_title}</p>
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>{click.platform} • {click.country}</span>
                    <span className="text-purple-400">/{click.short_url}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
