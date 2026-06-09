import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAdminStore from '../../store/adminStore';
import { Layers, ArrowLeft, RefreshCw } from 'lucide-react';

const statusColor = (count) => (count > 0 ? 'text-yellow-400' : 'text-gray-400');

export default function QueueMonitor() {
  const { queueStats, fetchQueueStats } = useAdminStore();

  useEffect(() => {
    fetchQueueStats();
    const interval = setInterval(fetchQueueStats, 10000);
    return () => clearInterval(interval);
  }, [fetchQueueStats]);

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen text-white">
      <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Layers className="text-cyan-400" />
            Queue Monitor
          </h1>
          <p className="text-gray-400 mt-2 text-sm">BullMQ job queue status across scraping, rendering, and retries.</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={fetchQueueStats} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm">
            <RefreshCw size={16} /> Refresh
          </button>
          <Link to="/admin/dashboard" className="text-gray-400 hover:text-white flex items-center gap-2 text-sm">
            <ArrowLeft size={16} /> Admin
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {queueStats.map((q) => (
          <div key={q.name} className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-bold mb-4 text-white">{q.name}</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-700/40 p-3 rounded-lg">
                <p className="text-gray-500">Waiting</p>
                <p className={`text-xl font-bold ${statusColor(q.waiting)}`}>{q.waiting || 0}</p>
              </div>
              <div className="bg-gray-700/40 p-3 rounded-lg">
                <p className="text-gray-500">Active</p>
                <p className="text-xl font-bold text-blue-400">{q.active || 0}</p>
              </div>
              <div className="bg-gray-700/40 p-3 rounded-lg">
                <p className="text-gray-500">Completed</p>
                <p className="text-xl font-bold text-green-400">{q.completed || 0}</p>
              </div>
              <div className="bg-gray-700/40 p-3 rounded-lg">
                <p className="text-gray-500">Failed</p>
                <p className="text-xl font-bold text-red-400">{q.failed || 0}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {queueStats.length === 0 && (
        <p className="text-center text-gray-500 py-12">No queue data. Ensure Redis is running.</p>
      )}
    </div>
  );
}
