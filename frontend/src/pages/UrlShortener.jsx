import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import useReelStore from '../store/reelStore';
import { Link2, Copy, ArrowLeft, MousePointerClick, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function UrlShortener() {
  const { campaigns, fetchCampaigns, isLoading } = useReelStore();

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleCopy = (text, label) => {
    if (!text) return toast.error(`No ${label} available`);
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen text-white">
      <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Link2 className="text-green-400" />
            URL Shortener & Campaigns
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Every reel gets a unique UTM short link. Copy and paste in your social comments.
          </p>
        </div>
        <Link to="/dashboard" className="text-gray-400 hover:text-white flex items-center gap-2 text-sm">
          <ArrowLeft size={16} /> Dashboard
        </Link>
      </div>

      {isLoading && campaigns.length === 0 ? (
        <p className="text-gray-500 text-center py-12">Loading campaigns...</p>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-20 bg-gray-800 rounded-xl border border-gray-700">
          <Link2 className="mx-auto text-gray-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-gray-300">No short links yet</h2>
          <p className="text-gray-500 mt-2 mb-6">Generate a reel to create your first unique campaign link.</p>
          <Link to="/studio" className="inline-block bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg font-bold">
            Create Reel
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="bg-gray-800 rounded-xl border border-gray-700 p-6 flex flex-col md:flex-row md:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{c.article_title || 'Untitled'}</p>
                <p className="text-xs text-gray-500 mt-1 capitalize">
                  {c.source_category} • {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                </p>
                <p className="font-mono text-green-400 text-sm mt-2 truncate">{c.full_short_url}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400 flex items-center gap-1">
                  <MousePointerClick size={14} className="text-green-400" />
                  {c.click_count} clicks
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(c.comment_link, 'Comment link')}
                  className="flex items-center gap-2 bg-green-600/20 text-green-400 hover:bg-green-600/30 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  <Copy size={16} /> Copy Link
                </button>
                <a href={c.full_short_url} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-white">
                  <ExternalLink size={18} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
