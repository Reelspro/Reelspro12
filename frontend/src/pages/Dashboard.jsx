import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useAnalyticsStore from '../store/analyticsStore';
import useSocketStore from '../store/socketStore';
import LiveRenderQueue from '../components/LiveRenderQueue';
import { Video, Download, MousePointerClick, TrendingUp, Settings, PlayCircle, BarChart3, Clock, Wifi, Link2, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const STATIC_URL = API_URL.replace('/api', '/output');

const StatCard = ({ icon: Icon, title, value, color, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl flex items-center gap-4 hover:border-gray-500 transition-colors"
  >
    <div className={`p-4 rounded-lg bg-${color}-500/20 text-${color}-400`}>
      <Icon size={32} />
    </div>
    <div>
      <p className="text-gray-400 text-sm font-medium">{title}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  </motion.div>
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

const Dashboard = () => {
  const { user } = useAuthStore();
  const { topReels, topCategories, feed, fetchTopData, fetchFeed } = useAnalyticsStore();
  const { connect, isConnected, reelProgress, disconnect } = useSocketStore();

  useEffect(() => {
    fetchTopData();
    fetchFeed();
  }, [fetchTopData, fetchFeed]);

  // Connect to Socket.io when user is available
  useEffect(() => {
    if (user?.id) {
      connect(user.id, user.role);
    }
    return () => { /* keep connection alive across page navigations */ };
  }, [user?.id, user?.role, connect]);

  const activeJobs = Object.values(reelProgress || {}).filter(j => j?.status === 'processing').length;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-900 text-white p-8"
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-700">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user?.name}! 👋</h1>
            <p className="text-gray-400 mt-2">Here is what's happening with your reels today.</p>
          </div>
          <div className="flex gap-4">
            {user?.role === 'admin' && (
              <Link to="/admin/dashboard" className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg flex items-center gap-2 transition font-bold shadow-lg shadow-orange-500/20">
                Admin Panel
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin/articles" className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 px-4 py-2 rounded-lg flex items-center gap-2 transition border border-purple-600/30">
                <FileText size={20} /> Article Pool
              </Link>
            )}
            <Link to="/shortener" className="bg-green-600/20 hover:bg-green-600/30 text-green-400 px-4 py-2 rounded-lg flex items-center gap-2 transition border border-green-600/30">
              <Link2 size={20} /> Short Links
            </Link>
            <Link to="/reel-generator" className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition shadow-lg shadow-blue-500/20">
              <Video size={20} /> Reel Generator
            </Link>
            <Link to="/storymaker" className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition shadow-lg shadow-purple-500/20">
              <PlayCircle size={20} /> Story Maker
            </Link>
            <Link to="/text-story" className="bg-pink-600 hover:bg-pink-700 px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition shadow-lg shadow-pink-500/20">
              <FileText size={20} /> Text Story
            </Link>
            <Link to="/settings" className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 transition">
              <Settings size={20} /> Settings
            </Link>
          </div>
        </div>
        
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={Video} title="Reels Generated" value={user?.reels_generated || 0} color="purple" delay={0.1} />
          <StatCard icon={Download} title="Downloads" value={user?.reel_downloads || 0} color="blue" delay={0.2} />
          <StatCard icon={MousePointerClick} title="Total Clicks" value={user?.clicks || 0} color="green" delay={0.3} />
          <StatCard icon={TrendingUp} title="Active Campaigns" value={user?.campaigns || 0} color="orange" delay={0.4} />
        </div>

        {/* Live Socket Status Bar */}
        <div className={`flex items-center justify-between px-4 py-2 rounded-lg mb-6 text-sm ${
          isConnected
            ? 'bg-green-900/20 border border-green-700/30 text-green-400'
            : 'bg-gray-800 border border-gray-700 text-gray-500'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
            <span>{isConnected ? 'Live rendering updates active' : 'Connecting to live service...'}</span>
          </div>
          {activeJobs > 0 && (
            <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
              {activeJobs} rendering...
            </span>
          )}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Top Performing Reels */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <TrendingUp className="text-purple-400" /> Top Performing Reels
                </h2>
                <Link to="/gallery" className="text-sm text-purple-400 hover:text-purple-300">View All</Link>
              </div>
              <div className="p-6">
                {!Array.isArray(topReels) || topReels.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No data yet. Generate your first reel!</p>
                ) : (
                  <div className="space-y-4">
                    {(topReels || []).map((reel, index) => (
                      <div key={reel.id} className="flex items-center gap-4 bg-gray-700/30 p-3 rounded-lg border border-gray-700">
                        <div className="text-gray-500 font-bold w-4">{index + 1}</div>
                        <div className="w-12 h-12 bg-black rounded overflow-hidden flex-shrink-0">
                          {reel.thumbnail_path && (
                            <img
                              src={`${STATIC_URL}/${reel.thumbnail_path.replace(/\\/g, '/')}`}
                              alt="Thumbnail"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-200 truncate" title={reel.article_title}>{reel.article_title}</p>
                          <p className="text-xs text-gray-400">/{reel.short_url}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-400 flex items-center gap-1 justify-end">
                            <MousePointerClick size={14} /> {reel.total_clicks}
                          </p>
                          <p className="text-xs text-gray-500">Clicks</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Top Categories */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <BarChart3 className="text-blue-400" /> Best Categories
                </h2>
              </div>
              <div className="p-6">
                {!Array.isArray(topCategories) || topCategories.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No data yet.</p>
                ) : (
                  <div className="space-y-4">
                    {(topCategories || []).map((cat, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-700/30 p-4 rounded-lg border border-gray-700">
                        <span className="font-medium capitalize text-gray-200">{cat.category}</span>
                        <div className="flex gap-6 text-sm text-gray-400">
                          <span><strong className="text-white">{cat.reels_count}</strong> Reels</span>
                          <span><strong className="text-green-400">{cat.total_clicks}</strong> Clicks</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Clock className="text-orange-400" /> Recent Clicks
                </h2>
                <Link to="/analytics" className="text-sm text-purple-400 hover:text-purple-300">Full Feed</Link>
              </div>
              <div className="p-6">
                {!Array.isArray(feed) || feed.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No recent activity.</p>
                ) : (
                  <div className="space-y-4">
                    {(feed || []).slice(0, 8).map((click) => (
                      <div key={click.id} className="relative pl-4 border-l-2 border-purple-500/30">
                        <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-purple-500"></div>
                        <p className="text-sm text-gray-300 font-medium truncate" title={click.article_title}>
                          {click.article_title}
                        </p>
                        <div className="flex gap-2 text-xs text-gray-500 mt-1">
                          <span>{click.platform}</span>
                          <span>•</span>
                          <span>
                            {click.created_at && !isNaN(new Date(click.created_at).getTime())
                              ? formatDistanceToNow(new Date(click.created_at), { addSuffix: true })
                              : 'recently'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 p-6 rounded-xl border border-purple-800 shadow-xl">
              <h3 className="font-bold text-white mb-2">Need More Traffic?</h3>
              <p className="text-sm text-purple-200 mb-4">Generate suspense reels and post them on TikTok, Shorts, and Instagram with your custom shortlink in the comments.</p>
              <Link to="/studio" className="block text-center w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded transition">
                Create New Reel Now
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* Floating Live Render Progress Queue (bottom-right) */}
      <LiveRenderQueue />

    </motion.div>
  );
};

export default Dashboard;
