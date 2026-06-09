import React, { useEffect } from 'react';
import useAnalyticsStore from '../store/analyticsStore';
import useAuthStore from '../store/authStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { Activity, Globe, Smartphone, Monitor, Globe2, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import Skeleton, { CardSkeleton, TableSkeleton } from '../components/Skeleton';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const Analytics = () => {
  const { chartsData, feed, fetchChartsData, fetchFeed, fetchGrowthAndEngagement, growthStats, engagementStats, initSocket, disconnectSocket, isLoading } = useAnalyticsStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchChartsData();
    fetchFeed();
    fetchGrowthAndEngagement();

    if (user) {
      initSocket(user.id, user.role);
    }

    return () => disconnectSocket();
  }, [fetchChartsData, fetchFeed, initSocket, disconnectSocket, user]);

  if (isLoading && !chartsData.clicksOverTime.length) {
    return (
      <div className="p-8 max-w-7xl mx-auto min-h-screen text-white">
        <div className="mb-8 border-b border-gray-700 pb-4">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-[380px]"><Skeleton className="h-full w-full" /></div>
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-[380px]"><Skeleton className="h-full w-full" /></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-8 max-w-7xl mx-auto min-h-screen text-white"
    >
      <div className="mb-8 border-b border-gray-700 pb-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Activity className="text-purple-500" />
          Real-Time Traffic Analytics
        </h1>
        <p className="text-gray-400 mt-2 text-sm">
          Live monitoring of your reel clicks, traffic sources, and audience demographics.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Clicks</span>
            <div className="p-2 bg-purple-500/10 rounded-lg"><Activity size={18} className="text-purple-400" /></div>
          </div>
          <div className="text-2xl font-bold">{engagementStats.totalClicks.toLocaleString()}</div>
          <div className={`flex items-center gap-1 text-xs mt-2 \${growthStats.growthPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {growthStats.growthPercent >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(growthStats.growthPercent)}% from last week
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Engagement Rate</span>
            <div className="p-2 bg-blue-500/10 rounded-lg"><Zap size={18} className="text-blue-400" /></div>
          </div>
          <div className="text-2xl font-bold">{engagementStats.avgClicksPerReel}</div>
          <div className="text-gray-500 text-xs mt-2">Avg. clicks per generated reel</div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Active Reels</span>
            <div className="p-2 bg-green-500/10 rounded-lg"><Monitor size={18} className="text-green-400" /></div>
          </div>
          <div className="text-2xl font-bold">{engagementStats.totalReels}</div>
          <div className="text-gray-500 text-xs mt-2">Content in circulation</div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Weekly Volume</span>
            <div className="p-2 bg-orange-500/10 rounded-lg"><Globe size={18} className="text-orange-400" /></div>
          </div>
          <div className="text-2xl font-bold">{growthStats.currentPeriod}</div>
          <div className="text-gray-500 text-xs mt-2">Clicks in the last 7 days</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Clicks Over Time */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Activity size={18} className="text-purple-400" /> Clicks (Last 7 Days)</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartsData.clicksOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Globe size={18} className="text-blue-400" /> Traffic Sources</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartsData.platformData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="platform"
                >
                  {chartsData.platformData.map((entry, index) => (
                    <Cell key={`cell-\${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Smartphone size={18} className="text-green-400" /> Devices</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartsData.deviceData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis dataKey="device" type="category" stroke="#9ca3af" />
                <Tooltip cursor={{ fill: '#374151' }} contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Country Breakdown */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Globe2 size={18} className="text-orange-400" /> Top Countries</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartsData.countryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="country" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" allowDecimals={false} />
                <Tooltip cursor={{ fill: '#374151' }} contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Live Click Feed */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          Live Click Feed
        </h2>
        
        {feed.length === 0 ? (
          <p className="text-gray-500 text-center py-8 text-gray-500 font-medium">
            No clicks recorded yet. Share your short links to track live traffic!
          </p>
        ) : (
          <div className="space-y-4">
            {feed.map((click) => {
              // Construct a nice country display with city
              const countryDisplay = `${click.country === 'Unknown' ? '🌐' : '📍'} ${click.country} ${click.city && click.city !== 'Unknown' ? `(${click.city})` : ''}`;
              
              return (
                <div key={click.id} className="p-5 bg-gray-800/40 hover:bg-gray-750/30 border border-gray-700 hover:border-purple-500/50 rounded-xl transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md">
                  <div className="flex-1 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-gray-100 text-sm md:text-base leading-tight">
                        {click.article_title || 'Unknown Reel Story'}
                      </span>
                      <span className="bg-purple-900/40 text-purple-300 border border-purple-800/50 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        /{click.short_url}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-400">
                      {/* IP Address */}
                      <span className="flex items-center gap-1.5 bg-gray-900/60 px-2 py-1 rounded border border-gray-700/60 text-gray-300 font-mono">
                        <span className="text-[10px] text-gray-500 uppercase font-sans font-bold">IP:</span> 
                        {click.ip_address || 'Unknown'}
                      </span>

                      {/* Device & OS */}
                      <span className="flex items-center gap-1.5 bg-gray-900/60 px-2 py-1 rounded border border-gray-700/60 text-gray-300">
                        {click.device === 'Mobile' ? '📱' : '💻'} {click.device} ({click.os} • {click.browser})
                      </span>

                      {/* Country & Location */}
                      <span className="flex items-center gap-1.5 bg-gray-900/60 px-2 py-1 rounded border border-gray-700/60 text-gray-300">
                        {countryDisplay}
                      </span>
                    </div>

                    {/* Referrer & Source */}
                    <div className="text-2xs text-gray-500 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-400 uppercase">Traffic Source:</span>
                      <span className="text-blue-400 bg-blue-950/20 border border-blue-900/40 px-1.5 py-0.5 rounded font-medium uppercase text-[10px]">
                        {click.platform || 'direct'}
                      </span>
                      {click.referrer && (
                        <span className="truncate max-w-xs md:max-w-md italic text-gray-600" title={click.referrer}>
                          (via {click.referrer})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto border-t md:border-t-0 border-gray-700/60 pt-3 md:pt-0 mt-1 md:mt-0 gap-2.5">
                    {click.user_name && (
                      <span className="text-2xs font-bold text-gray-400 bg-gray-900 px-2.5 py-1 rounded border border-gray-750">
                        👤 {click.user_name}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 font-semibold bg-gray-900/40 px-2.5 py-1 rounded border border-gray-700/40">
                      {formatDistanceToNow(new Date(click.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>  );
};

export default Analytics;
