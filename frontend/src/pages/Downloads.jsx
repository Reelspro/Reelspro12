import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Download, Share2, Calendar, Video, PlayCircle, Clock, 
  Trash2, AlertCircle, Copy, Link2, ExternalLink, CalendarDays, X, Sparkles, Play
} from 'lucide-react';
import useReelStore from '../store/reelStore';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = API_URL.replace('/api', '');

export default function Downloads() {
  const { reels, isLoading, fetchReels, downloadReel, deleteReel } = useReelStore();
  
  // Date range filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'text_story' | 'video'
  
  // Active playing video modal / preview
  const [previewVideoUrl, setPreviewVideoUrl] = useState(null);

  // Fetch only completed reels on mount
  useEffect(() => {
    fetchReels({ status: 'completed' });
  }, [fetchReels]);

  // Extract thumbnail URL safely
  const getThumbnailUrl = (reel) => {
    if (reel && reel.thumbnail_path) {
      const path = reel.thumbnail_path.startsWith('/') ? reel.thumbnail_path : `/${reel.thumbnail_path}`;
      return `${BASE_URL}${path}`;
    }
    return (reel && reel.article_image) || null;
  };

  // Safe helper to calculate reel duration from scenes_json
  const getReelDuration = (reel) => {
    if (reel && reel.scenes_json) {
      try {
        const scenes = typeof reel.scenes_json === 'string' 
          ? JSON.parse(reel.scenes_json) 
          : reel.scenes_json;
        if (Array.isArray(scenes)) {
          const total = scenes.reduce((sum, s) => sum + (s.duration || 0), 0);
          if (total > 0) return Math.round(total);
        }
      } catch (e) {
        // ignore parsing error
      }
    }
    return 30; // fallback duration
  };

  // Handle share (copy link to clipboard)
  const handleShare = (reel) => {
    if (!reel) return;
    const shareUrl = reel.full_short_url || `${window.location.origin}/r/${reel.short_url}`;
    try {
      if (navigator.share) {
        navigator.share({
          title: reel.article_title || 'Generated Reel',
          text: reel.caption || 'Check out my new generated reel!',
          url: shareUrl,
        }).catch((err) => {
          // Fallback to clipboard if share cancelled
          copyToClipboard(shareUrl);
        });
      } else {
        copyToClipboard(shareUrl);
      }
    } catch (e) {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text) => {
    if (text) {
      navigator.clipboard.writeText(text);
      toast.success('Link copied to clipboard! 🔗');
    }
  };

  // Filter reels by date range locally
  const filteredReels = useMemo(() => {
    if (!reels) return [];
    
    // Sort completed reels just in case
    const completedOnly = reels.filter(r => r && r.status === 'completed');

    return completedOnly.filter(reel => {
      if (!reel) return false;
      // Type filter
      if (typeFilter === 'text_story' && reel.bg_type !== 'text_story') return false;
      if (typeFilter === 'video' && reel.bg_type === 'text_story') return false;
      if (!reel.created_at) return true;
      const reelDate = new Date(reel.created_at);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (reelDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (reelDate > end) return false;
      }
      return true;
    });
  }, [reels, startDate, endDate, typeFilter]);

  const clearDateFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Kya aap waqai is reel ko delete karna chahte hain?')) {
      const success = await deleteReel(id);
      if (success) {
        toast.success('Reel deleted successfully');
      }
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen text-white">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            <Video className="text-purple-500" size={32} />
            Completed Reels Gallery
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Download your rendered high-definition MP4 reels, copy campaigns, or preview clips.</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/reel-generator"
            className="bg-blue-650 hover:bg-blue-600 flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition shadow-lg shadow-blue-500/10"
          >
            <Sparkles size={16} />
            Generator
          </Link>
          <Link
            to="/studio"
            className="bg-purple-650 hover:bg-purple-600 flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition shadow-lg shadow-purple-500/10"
          >
            <PlayCircle size={18} />
            Reel Studio
          </Link>
        </div>
      </div>

      {/* Date Filters Panel */}
      <div className="bg-gray-800/40 border border-gray-800 p-4 rounded-2xl mb-8 flex flex-wrap items-center justify-between gap-4 backdrop-blur">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <CalendarDays size={18} className="text-purple-400" />
            <span>Filter by Date Range:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-gray-900 border border-gray-700/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 text-white"
            />
            <span className="text-gray-650 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-gray-900 border border-gray-700/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 text-white"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={clearDateFilters}
              className="text-xs flex items-center gap-1 text-pink-400 hover:text-pink-300 bg-pink-950/20 border border-pink-900/30 px-3 py-1.5 rounded-lg transition"
            >
              <X size={12} /> Clear Filters
            </button>
          )}
        </div>
        <div className="text-xs text-gray-500">
          Showing <span className="text-purple-400 font-bold">{filteredReels.length}</span> completed reels
        </div>
      </div>

      {/* Type Filter Tabs */}
      <div className="flex gap-3 mb-6">
        {[
          { id: 'all', label: '🎬 All Reels' },
          { id: 'text_story', label: '📝 Text Stories' },
          { id: 'video', label: '🎥 Video Reels' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setTypeFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
              typeFilter === tab.id
                ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                : 'bg-gray-800/40 border-gray-700 text-gray-400 hover:border-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SKELETON LOADER STATE */}
      {isLoading && reels.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-800/40 border border-gray-800/60 rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-[9/16] bg-gray-900" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-750 rounded w-3/4" />
                <div className="h-3 bg-gray-750 rounded w-1/2" />
                <div className="pt-2 space-y-2">
                  <div className="h-9 bg-gray-750 rounded-lg" />
                  <div className="h-9 bg-gray-750 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredReels.length === 0 ? (
        /* EMPTY STATE */
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 bg-gray-800/20 rounded-2xl border border-gray-800 max-w-xl mx-auto shadow-xl"
        >
          <div className="w-20 h-20 bg-purple-950/40 border border-purple-800/30 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-6 relative">
            <Video size={40} className="relative z-10" />
            <div className="absolute inset-0 rounded-full border border-purple-500/20 animate-ping" />
          </div>
          <h2 className="text-xl font-bold text-gray-200">Koi reels nahi hain abhi</h2>
          <p className="text-gray-400 mt-2 text-sm max-w-sm mx-auto px-4">
            {startDate || endDate 
              ? "Is selected date range mein koi completed reels nahi mili hain. Dosri dates try karein." 
              : "Aapne abhi tak koi reel video render nahi ki hai. Generator ya Studio khol kar start karein."
            }
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {startDate || endDate ? (
              <button 
                onClick={clearDateFilters}
                className="px-5 py-2 bg-gray-800 hover:bg-gray-750 text-white rounded-xl text-sm font-semibold transition"
              >
                Clear Date filters
              </button>
            ) : (
              <Link 
                to="/reel-generator" 
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-purple-500/20"
              >
                Generate First Reel
              </Link>
            )}
          </div>
        </motion.div>
      ) : (
        /* REELS GALLERY GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredReels.map((reel, idx) => {
            if (!reel) return null;
            const thumb = getThumbnailUrl(reel);
            const duration = getReelDuration(reel);
            return (
              <motion.div
                key={reel.id || idx}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/50 border border-gray-800/60 rounded-2xl overflow-hidden hover:border-purple-500/40 transition-all group shadow-xl backdrop-blur relative"
              >
                {/* Preview / Thumbnail Overlay */}
                <div className="aspect-[9/16] bg-gray-900 relative overflow-hidden">
                  {thumb ? (
                    <img 
                      src={thumb} 
                      alt="" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-700 bg-gray-950">
                      <Video size={48} />
                    </div>
                  )}
                  
                  {/* Floating badges */}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <div className="bg-black/60 border border-gray-850 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 backdrop-blur">
                      <Clock size={12} className="text-purple-400" />
                      <span>{duration}s</span>
                    </div>
                    {reel.bg_type === 'text_story' && (
                      <div className="bg-pink-600/80 border border-pink-500 text-xs px-2.5 py-1 rounded-full font-bold text-white backdrop-blur">
                        📝 Text Story
                      </div>
                    )}
                  </div>

                  {/* Play video overlay trigger */}
                  {reel.file_path && (
                    <button
                      onClick={() => setPreviewVideoUrl(`${BASE_URL}${reel.file_path.startsWith('/') ? reel.file_path : `/${reel.file_path}`}`)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300"
                    >
                      <div className="w-12 h-12 bg-purple-600 hover:bg-purple-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-500/30 transform scale-75 group-hover:scale-100 transition-all">
                        <Play size={20} className="fill-current ml-0.5" />
                      </div>
                    </button>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(reel.id)}
                    className="absolute top-3 right-3 w-8 h-8 bg-red-950/80 hover:bg-red-900 border border-red-900/30 text-red-400 hover:text-white rounded-full flex items-center justify-center transition backdrop-blur opacity-0 group-hover:opacity-100"
                    title="Delete Reel"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Reel Card Details */}
                <div className="p-4">
                  <h3 className="font-bold text-sm text-gray-200 line-clamp-2 min-h-[40px] mb-2" title={reel.article_title || reel.caption}>
                    {reel.article_title || reel.caption || 'Untitled Reel'}
                  </h3>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4 border-t border-gray-750 pt-2">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-gray-650" />
                      <span>{reel.created_at ? new Date(reel.created_at).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    {reel.source_category && (
                      <span className="bg-gray-800/80 border border-gray-750 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-gray-400">
                        {reel.source_category}
                      </span>
                    )}
                  </div>

                  {/* Card Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => downloadReel(reel.id)}
                      className="flex items-center justify-center gap-2 py-2.5 bg-green-700/20 hover:bg-green-600 border border-green-700/30 text-green-400 hover:text-white rounded-xl text-sm font-semibold transition"
                    >
                      <Download size={14} />
                      <span>Download</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShare(reel)}
                      className="flex items-center justify-center gap-2 py-2.5 bg-gray-800 hover:bg-gray-750 border border-gray-700/60 rounded-xl text-sm font-medium transition"
                    >
                      <Share2 size={14} className="text-purple-400" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* VIDEO PREVIEW MODAL */}
      <AnimatePresence>
        {previewVideoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewVideoUrl(null)}
            className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4"
          >
            <button
              onClick={() => setPreviewVideoUrl(null)}
              className="absolute top-6 right-6 w-12 h-12 bg-gray-800/60 hover:bg-gray-700 text-white rounded-full flex items-center justify-center transition border border-gray-700"
            >
              <X size={24} />
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-950 rounded-2xl overflow-hidden aspect-[9/16] max-h-[90vh] border border-gray-850 shadow-2xl relative"
            >
              <video
                src={previewVideoUrl}
                controls
                autoPlay
                className="w-full h-full object-cover"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

