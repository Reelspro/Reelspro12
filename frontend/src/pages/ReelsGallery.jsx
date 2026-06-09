import React, { useEffect } from 'react';
import useReelStore from '../store/reelStore';
import { Download, Copy, PlayCircle, Loader2, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { CardSkeleton } from '../components/Skeleton';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const STATIC_URL = API_URL.replace('/api', '/output');

const ReelsGallery = () => {
  const { reels, fetchReels, generateReel, downloadReel, isLoading, isGenerating } = useReelStore();

  useEffect(() => {
    fetchReels();
    
    const interval = setInterval(() => {
      const needsPolling = useReelStore.getState().reels.some(
        r => r.status === 'queued' || r.status === 'processing'
      );
      if (needsPolling) fetchReels();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [fetchReels]);

  const handleCopy = (text, label) => {
    if (!text) {
      toast.error(`No ${label} available`);
      return;
    }
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 max-w-7xl mx-auto min-h-screen text-white"
    >
      <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Video className="text-purple-500" />
            Generated Reels Gallery
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            View your reel history, download MP4s, and copy viral captions.
          </p>
        </div>
        <button
          onClick={() => generateReel('horror')}
          disabled={isGenerating}
          className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <PlayCircle size={20} />}
          {isGenerating ? 'Queuing...' : 'Generate New Reel'}
        </button>
      </div>

      {isLoading && reels.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      ) : reels.length === 0 ? (
        <div className="text-center py-20 bg-gray-800 rounded-xl border border-gray-700">
          <Video className="mx-auto text-gray-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-gray-300">No reels generated yet</h2>
          <p className="text-gray-500 mt-2">Click the button above to generate your first AI reel.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {reels.map((reel, idx) => (
            <motion.div 
              key={reel.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -5 }}
              className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-xl flex flex-col group hover:border-purple-500/50 transition-all"
            >
              
              {/* Thumbnail / Video Area */}
              <div className="relative aspect-[9/16] bg-black flex items-center justify-center">
                {reel.status === 'completed' && reel.thumbnail_path ? (
                  <img 
                    src={`${STATIC_URL}/${reel.thumbnail_path.replace(/\\/g, '/')}`} 
                    alt="Thumbnail" 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : reel.status === 'failed' ? (
                  <div className="text-red-500 text-center p-4">
                    <p className="font-bold">Generation Failed</p>
                    <p className="text-xs mt-2">Check server logs</p>
                  </div>
                ) : (
                  <div className="text-center flex flex-col items-center p-4">
                    <Loader2 className="animate-spin text-purple-500 mb-3" size={32} />
                    <p className="text-purple-400 font-medium capitalize">{reel.status}...</p>
                  </div>
                )}
                
                <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    reel.status === 'completed' ? 'bg-green-600' :
                    reel.status === 'failed' ? 'bg-red-600' : 'bg-yellow-600 text-black'
                  }`}>
                    {reel.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-sm text-gray-200 line-clamp-2 mb-4 flex-1" title={reel.article_title}>
                  {reel.article_title || 'Unknown Article'}
                </h3>
                
                <div className="space-y-2 mt-auto">
                  <button
                    onClick={() => downloadReel(reel.id)}
                    disabled={reel.status !== 'completed'}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white py-2 rounded text-sm font-medium transition"
                  >
                    <Download size={16} /> Download MP4
                  </button>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleCopy(reel.caption, 'Caption')}
                      disabled={!reel.caption}
                      className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white py-2 rounded text-sm font-medium transition"
                    >
                      <Copy size={16} /> Caption
                    </button>
                    <button
                      onClick={() => handleCopy(reel.short_url ? `${API_URL.replace('/api', '')}/r/${reel.short_url}` : null, 'Comment Link')}
                      disabled={!reel.short_url}
                      className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white py-2 rounded text-sm font-medium transition"
                    >
                      <Copy size={16} /> Link
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ReelsGallery;
