/**
 * LiveRenderQueue.jsx — Phase 20: Real-time Render Progress Panel
 *
 * Shows a floating panel on Dashboard with live progress bars
 * for every reel currently being processed.
 *
 * Data flows: Backend Worker → Socket.io → socketStore → here
 */

import React from 'react';
import { Zap, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import useSocketStore from '../store/socketStore';

const STEP_COLORS = {
  processing: 'from-purple-600 to-blue-500',
  completed:  'from-green-500 to-emerald-400',
  failed:     'from-red-600 to-rose-500'
};

const StatusIcon = ({ status }) => {
  if (status === 'completed') return <CheckCircle size={16} className="text-green-400 flex-shrink-0" />;
  if (status === 'failed')    return <AlertCircle size={16} className="text-red-400 flex-shrink-0" />;
  return <Loader size={16} className="text-purple-400 animate-spin flex-shrink-0" />;
};

const LiveRenderQueue = () => {
  const { reelProgress, isConnected, dismissJob } = useSocketStore();
  const jobs = Object.values(reelProgress);

  if (jobs.length === 0) return null;

  return (
    <div
      id="live-render-queue"
      className="fixed bottom-6 right-6 z-50 w-80 flex flex-col gap-3 pointer-events-none"
    >
      {jobs.map((job) => {
        const gradientClass = STEP_COLORS[job.status] || STEP_COLORS.processing;
        const percent = Math.max(0, Math.min(100, job.percent || 0));

        return (
          <div
            key={job.reelId}
            className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4 pointer-events-auto
                       animate-in slide-in-from-right-4 duration-300"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-purple-400" />
                <span className="text-sm font-bold text-white">Rendering Reel</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-mono">
                  {job.reelId?.slice(0, 8)}...
                </span>
                <button
                  onClick={() => dismissJob(job.reelId)}
                  className="p-1 hover:bg-gray-700 rounded text-gray-500 hover:text-white transition"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Step label */}
            <div className="flex items-center gap-2 mb-2">
              <StatusIcon status={job.status} />
              <p className="text-xs text-gray-300 truncate flex-1">{job.step || 'Initializing...'}</p>
              <span className={`text-xs font-bold ${
                job.status === 'completed' ? 'text-green-400' :
                job.status === 'failed'    ? 'text-red-400'   : 'text-purple-400'
              }`}>
                {percent}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${gradientClass} rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${percent}%` }}
              />
            </div>

            {/* Completed CTA */}
            {job.status === 'completed' && job.short_url && (
              <div className="mt-3 flex items-center justify-between bg-green-900/20 border border-green-700/30 rounded-lg px-3 py-2">
                <span className="text-xs text-green-400">Ready! Short URL:</span>
                <span className="text-xs font-mono text-green-300 font-bold">/{job.short_url}</span>
              </div>
            )}
          </div>
        );
      })}

      {/* Connection status indicator */}
      <div className="pointer-events-auto flex justify-end">
        <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
          isConnected ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-500'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
          {isConnected ? 'Live' : 'Disconnected'}
        </div>
      </div>
    </div>
  );
};

export default LiveRenderQueue;
