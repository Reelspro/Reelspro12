import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';
import useReelStore from '../store/reelStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, Sparkles, AlertCircle, CheckCircle, Download, Play, 
  RotateCcw, Sliders, Music, Mic, ChevronRight, Eye, Film, ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = API_URL.replace('/api', '');
const BASE_URL = SOCKET_URL;

const THEMES = [
  { id: 'suspense', label: 'Suspense', desc: 'Dark/moody cinematic purple & black styling', color: 'purple' },
  { id: 'horror', label: 'Horror', desc: 'Spooky red & black styling with high contrast', color: 'red' },
  { id: 'modern', label: 'Modern', desc: 'Clean, elegant style with smooth overlays', color: 'blue' },
  { id: 'minimal', label: 'Minimal', desc: 'Simple text centered on dark backgrounds', color: 'gray' },
  { id: 'bold', label: 'Bold', desc: 'Heavy fonts, yellow highlights, energetic style', color: 'yellow' }
];

const VOICES = [
  { id: 'Jenny', name: 'Jenny', info: 'US, Female · Emotional & Slow (Recommended)' },
  { id: 'Aria', name: 'Aria', info: 'US, Female · Warm and conversational' },
  { id: 'Guy', name: 'Guy', info: 'US, Male · Deep & Professional' },
  { id: 'Michelle', name: 'Michelle', info: 'US, Female · Soft & Calm' },
  { id: 'none', name: 'None (Silent)', info: 'Do not generate audio voiceover' }
];

export default function ReelGenerator() {
  const { user } = useAuthStore();
  const { generateReel, isGenerating } = useReelStore();

  // Settings state
  const [activeTab, setActiveTab] = useState('custom'); // 'custom' | 'article'
  const [selectedTheme, setSelectedTheme] = useState('suspense');
  const [duration, setDuration] = useState(30);
  const [selectedVoice, setSelectedVoice] = useState('Jenny');
  const [selectedMusic, setSelectedMusic] = useState('none');
  const [storyTitle, setStoryTitle] = useState('');
  const [storyContent, setStoryContent] = useState('');
  const [textStoryMode, setTextStoryMode] = useState(true); // Full page text story display

  // Articles & Music options
  const [articles, setArticles] = useState([]);
  const [selectedArticleId, setSelectedArticleId] = useState('');
  const [musicTracks, setMusicTracks] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Render & socket state
  const [activeReelId, setActiveReelId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // 'idle' | 'rendering' | 'completed' | 'failed'
  const [step, setStep] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Ref to always access the active reel ID inside the socket event listeners
  const activeReelIdRef = useRef(null);

  useEffect(() => {
    activeReelIdRef.current = activeReelId;
  }, [activeReelId]);

  // Load articles and music tracks on mount
  useEffect(() => {
    const loadData = async () => {
      setLoadingOptions(true);
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch music
        const musicRes = await axios.get(`${API_URL}/reels/music`, { headers }).catch(() => ({ data: [] }));
        setMusicTracks(musicRes.data || []);

        // Fetch articles
        const articlesRes = await axios.get(`${API_URL}/reels/available-articles`, { headers }).catch(() => ({ data: { articles: [] } }));
        setArticles(articlesRes.data?.articles || []);
        if (articlesRes.data?.articles?.length > 0) {
          setSelectedArticleId(articlesRes.data.articles[0].id);
        }
      } catch (err) {
        console.error('Failed to load generator options:', err);
      } finally {
        setLoadingOptions(false);
      }
    };

    loadData();
  }, []);

  // Connect to socket.io once user details are loaded, cleanup on unmount
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
    });

    socket.on('connect', () => {
      console.log('[ReelGenerator Socket] Connected:', socket.id);
      if (user?.id) {
        socket.emit('join', user.id);
      }
    });

    // Progress listener
    socket.on('render:progress', (data) => {
      console.log('[ReelGenerator Socket] progress:', data);
      if (activeReelIdRef.current && data.reelId === activeReelIdRef.current) {
        setProgress(Math.round(data.progress ?? data.percent ?? 0));
        setStep(data.step || 'Rendering video frames...');
      }
    });

    // Complete listener
    socket.on('render:complete', (data) => {
      console.log('[ReelGenerator Socket] complete:', data);
      if (activeReelIdRef.current && data.reelId === activeReelIdRef.current) {
        setProgress(100);
        setStatus('completed');
        setDownloadUrl(`${BASE_URL}${data.outputPath}`);
        setThumbnailUrl(data.thumbnailPath ? `${BASE_URL}${data.thumbnailPath}` : null);
        setStep('✅ Reel rendered successfully!');
        toast.success('Reel rendering complete!');
      }
    });

    // Failed listener
    socket.on('render:failed', (data) => {
      console.log('[ReelGenerator Socket] failed:', data);
      if (activeReelIdRef.current && data.reelId === activeReelIdRef.current) {
        setStatus('failed');
        setErrorMessage(data.error || 'Unknown rendering error.');
        setStep('❌ Reel rendering failed.');
        toast.error('Reel generation failed.');
      }
    });

    // Support legacy events (reel_progress, reel_complete, reel_failed)
    socket.on('reel_progress', (data) => {
      if (activeReelIdRef.current && data.reelId === activeReelIdRef.current) {
        setProgress(Math.round(data.progress ?? data.percent ?? 0));
        if (data.step) setStep(data.step);
      }
    });

    socket.on('reel_complete', (data) => {
      if (activeReelIdRef.current && data.reelId === activeReelIdRef.current) {
        setProgress(100);
        setStatus('completed');
        setDownloadUrl(`${BASE_URL}${data.downloadUrl || data.outputPath}`);
        setThumbnailUrl(data.thumbnailUrl ? `${BASE_URL}${data.thumbnailUrl}` : null);
        setStep('✅ Reel rendered successfully!');
        toast.success('Reel rendering complete!');
      }
    });

    socket.on('reel_failed', (data) => {
      if (activeReelIdRef.current && data.reelId === activeReelIdRef.current) {
        setStatus('failed');
        setErrorMessage(data.error || 'Unknown rendering error.');
        setStep('❌ Reel rendering failed.');
        toast.error('Reel generation failed.');
      }
    });

    return () => {
      console.log('[ReelGenerator Socket] Disconnecting...');
      socket.disconnect();
    };
  }, [user?.id]);

  const handleFetchRandomArticle = async () => {
    const token = localStorage.getItem('token');
    const loadToast = toast.loading('Fetching random story from website...');
    try {
      const res = await axios.get(`${API_URL}/reels/random-website-article`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success && res.data?.article) {
        setStoryContent(res.data.article.content || res.data.article.title);
        setActiveTab('custom');
        toast.success('Random story loaded!', { id: loadToast });
      } else {
        toast.error(res.data?.error || 'Failed to fetch article', { id: loadToast });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to fetch article', { id: loadToast });
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (activeTab === 'custom' && !storyContent.trim()) {
      toast.error('Please enter the story content script.');
      return;
    }
    
    setStatus('rendering');
    setProgress(0);
    setStep('Submitting generation job...');
    setErrorMessage('');
    setDownloadUrl('');
    setThumbnailUrl('');

    const voice = selectedVoice;
    const musicId = selectedMusic;
    const musicEnabled = selectedMusic !== 'none';

    const customization = {
      voice,
      musicId,
      musicEnabled,
      renderingEngine: 'remotion',
      textStoryMode
    };

    try {
      const token = localStorage.getItem('token');
      const payload = {
        theme: selectedTheme,
        customization,
        duration: parseInt(duration, 10),
        category: 'all',
        bgType: 'none',
        customImagePath: null,
        storyContent: activeTab === 'custom' ? storyContent : null,
        articleId: activeTab === 'article' ? selectedArticleId : null
      };

      const res = await axios.post(`${API_URL}/reels/generate`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.reelId) {
        setActiveReelId(res.data.reelId);
        toast.success(res.data.message || 'Generation started! Listening for updates...');
      } else {
        throw new Error('No reelId returned from server');
      }
    } catch (err) {
      console.error(err);
      setStatus('failed');
      setErrorMessage(err.response?.data?.error || err.message || 'Failed to start generation');
      setStep('❌ Submission failed');
      toast.error('Failed to submit generation job.');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setProgress(0);
    setActiveReelId(null);
    setStep('');
    setErrorMessage('');
    setDownloadUrl('');
    setThumbnailUrl('');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition">
            <ArrowLeft size={18} />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Title */}
        <div className="mb-8 border-b border-gray-800 pb-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent flex items-center gap-3">
            <Video className="text-purple-500" size={32} />
            AI Reel Generator
          </h1>
          <p className="text-gray-400 mt-2">Generate premium suspense & horror story reels. Configure parameters and watch render progress in real time.</p>
        </div>

        <AnimatePresence mode="wait">
          {/* IDLE / SETUP STATE */}
          {status === 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left Column - Configuration Form */}
              <form onSubmit={handleGenerate} className="lg:col-span-2 space-y-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-800 backdrop-blur">
                <h2 className="text-xl font-bold flex items-center gap-2 border-b border-gray-700 pb-3">
                  <Sliders className="text-purple-400" size={20} />
                  Configure Parameters
                </h2>

                {/* Text Story Mode Toggle */}
                <div
                  onClick={() => setTextStoryMode(!textStoryMode)}
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all select-none ${
                    textStoryMode
                      ? 'bg-gradient-to-r from-purple-950/40 to-pink-950/30 border-purple-500 shadow-lg shadow-purple-500/10'
                      : 'bg-gray-900 border-gray-705 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                      textStoryMode ? 'bg-purple-600/30 border border-purple-500/40' : 'bg-gray-800 border border-gray-700'
                    }`}>
                      📖
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">Full Page Text Story Mode</div>
                      <div className="text-xs text-gray-500 mt-0.5">Text fills the entire screen — no background video, just bold story text on color</div>
                    </div>
                  </div>
                  <div className={`relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${
                    textStoryMode ? 'bg-purple-600' : 'bg-gray-700'
                  }`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${
                      textStoryMode ? 'left-7' : 'left-1'
                    }`} />
                  </div>
                </div>

                {/* Script Mode Selection Tabs */}
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Input Mode</label>
                  <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-850">
                    <button
                      type="button"
                      onClick={() => setActiveTab('custom')}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition ${
                        activeTab === 'custom' ? 'bg-purple-650 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      ✏️ Custom Script
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('article')}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition ${
                        activeTab === 'article' ? 'bg-purple-650 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      📰 From Article Pool
                    </button>
                  </div>
                </div>

                {activeTab === 'custom' ? (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="storyTitle" className="block text-sm font-semibold text-gray-400 mb-1">Story Title (Optional)</label>
                      <input
                        id="storyTitle"
                        type="text"
                        value={storyTitle}
                        onChange={(e) => setStoryTitle(e.target.value)}
                        placeholder="e.g. The Whispering Walls"
                        className="w-full bg-gray-900 border border-gray-705 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="storyContent" className="block text-sm font-semibold text-gray-400">Story Content Script (Required)</label>
                        <button 
                          type="button"
                          onClick={handleFetchRandomArticle}
                          className="px-3 py-1 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-bold hover:bg-purple-600/30 transition-all flex items-center gap-1"
                        >
                          ⚡ Auto Fetch Story
                        </button>
                      </div>
                      <textarea
                        id="storyContent"
                        value={storyContent}
                        onChange={(e) => setStoryContent(e.target.value)}
                        rows={5}
                        placeholder="Type or paste your storytelling scenes script here..."
                        className="w-full bg-gray-900 border border-gray-705 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="articleSelect" className="block text-sm font-semibold text-gray-400 mb-1">Select Article</label>
                    {loadingOptions ? (
                      <div className="h-12 bg-gray-900 border border-gray-705 rounded-xl animate-pulse flex items-center justify-center text-sm text-gray-500">
                        Loading articles...
                      </div>
                    ) : articles.length === 0 ? (
                      <div className="bg-yellow-950/20 border border-yellow-900/30 text-yellow-300 p-4 rounded-xl text-sm">
                        No articles available in the article pool. Please scrape some articles first or use Custom Script mode.
                      </div>
                    ) : (
                      <select
                        id="articleSelect"
                        value={selectedArticleId}
                        onChange={(e) => setSelectedArticleId(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-705 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {articles.map((art) => (
                          <option key={art.id} value={art.id}>
                            [{art.source_category || 'general'}] {art.title}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* Duration */}
                <div>
                  <div className="flex justify-between items-center text-sm font-semibold text-gray-400 mb-2">
                    <span>Target Duration</span>
                    <span className="text-purple-400 font-bold">{duration} seconds</span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={90}
                    step={15}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full h-2 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-650 mt-1 px-1">
                    <span>15s</span>
                    <span>30s</span>
                    <span>45s</span>
                    <span>60s</span>
                    <span>75s</span>
                    <span>90s</span>
                  </div>
                </div>

                {/* Theme Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Visual Theme</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {THEMES.map((theme) => (
                      <div
                        key={theme.id}
                        onClick={() => setSelectedTheme(theme.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition ${
                          selectedTheme === theme.id
                            ? 'bg-purple-950/20 border-purple-500 shadow-lg shadow-purple-500/10'
                            : 'bg-gray-900 border-gray-705 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full bg-${theme.color}-500`} />
                          <span className="font-semibold text-sm">{theme.label}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{theme.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isGenerating || (activeTab === 'article' && articles.length === 0)}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles size={20} />
                  <span>Generate Reel Video</span>
                </button>
              </form>

              {/* Right Column - Voice, Audio & Preview Side Panel */}
              <div className="space-y-6">
                {/* Voice Selection */}
                <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-800 backdrop-blur">
                  <h3 className="text-lg font-bold flex items-center gap-2 border-b border-gray-700 pb-3 mb-4">
                    <Mic className="text-blue-400" size={18} />
                    Voice Narration
                  </h3>
                  <div className="space-y-3">
                    {VOICES.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVoice(v.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition ${
                          selectedVoice === v.id
                            ? 'bg-blue-950/20 border-blue-500'
                            : 'bg-gray-900 border-gray-705 hover:border-gray-600'
                        }`}
                      >
                        <div className="font-semibold text-sm text-gray-200">{v.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{v.info}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Music Selection */}
                <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-800 backdrop-blur">
                  <h3 className="text-lg font-bold flex items-center gap-2 border-b border-gray-700 pb-3 mb-4">
                    <Music className="text-pink-400" size={18} />
                    Background Music
                  </h3>
                  {loadingOptions ? (
                    <div className="space-y-2">
                      <div className="h-10 bg-gray-900 border border-gray-705 rounded-xl animate-pulse" />
                      <div className="h-10 bg-gray-900 border border-gray-705 rounded-xl animate-pulse" />
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      <div
                        onClick={() => setSelectedMusic('none')}
                        className={`p-3 rounded-xl border cursor-pointer transition ${
                          selectedMusic === 'none'
                            ? 'bg-pink-950/20 border-pink-500'
                            : 'bg-gray-900 border-gray-705 hover:border-gray-600'
                        }`}
                      >
                        <div className="font-semibold text-sm text-gray-200">No background music</div>
                        <div className="text-xs text-gray-500 mt-0.5">Silent background track</div>
                      </div>
                      {musicTracks.map((track) => (
                        <div
                          key={track.id}
                          onClick={() => setSelectedMusic(track.id)}
                          className={`p-3 rounded-xl border cursor-pointer transition ${
                            selectedMusic === track.id
                              ? 'bg-pink-950/20 border-pink-500'
                              : 'bg-gray-900 border-gray-705 hover:border-gray-600'
                        }`}
                        >
                          <div className="font-semibold text-sm text-gray-200 truncate">
                            {track.filename.replace(/\.[^.]+$/, '').replace(/_/g, ' ')}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 capitalize">{track.category} · {track.duration || '45s'}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* TEXT STORY MODE LIVE PREVIEW */}
              {textStoryMode && (
                <div className="bg-gray-800/50 p-6 rounded-2xl border border-purple-800/40 backdrop-blur">
                  <h3 className="text-sm font-bold text-purple-400 mb-4 flex items-center gap-2">
                    <Eye className="text-purple-400" size={14} />
                    Text Story Preview
                  </h3>
                  <div className="flex justify-center">
                    {/* Phone Mockup */}
                    <div className="relative border-[6px] border-gray-800 rounded-[32px] w-[160px] h-[284px] overflow-hidden shadow-2xl select-none">
                      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-14 h-3 bg-gray-800 rounded-full z-20" />
                      {/* Full-page gradient background */}
                      <div className={`absolute inset-0 z-0 ${
                        selectedTheme === 'horror' ? 'bg-gradient-to-br from-red-950 via-gray-950 to-black' :
                        selectedTheme === 'bold' ? 'bg-gradient-to-br from-yellow-950 via-zinc-900 to-black' :
                        selectedTheme === 'modern' ? 'bg-gradient-to-br from-blue-950 via-slate-900 to-black' :
                        selectedTheme === 'minimal' ? 'bg-gradient-to-b from-gray-900 to-black' :
                        'bg-gradient-to-br from-purple-950 via-indigo-950 to-black'
                      }`} />
                      {/* Full-page text overlay */}
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-3 text-center">
                        <div className={`text-[9px] font-black leading-tight uppercase tracking-wide ${
                          selectedTheme === 'horror' ? 'text-red-400' :
                          selectedTheme === 'bold' ? 'text-yellow-400' :
                          selectedTheme === 'modern' ? 'text-cyan-300' :
                          selectedTheme === 'minimal' ? 'text-white' :
                          'text-purple-300'
                        }`}>
                          {storyContent.trim()
                            ? storyContent.substring(0, 120) + (storyContent.length > 120 ? '...' : '')
                            : 'Your story text will be displayed here filling the entire screen in large, bold typography...'}
                        </div>
                      </div>
                      {/* Subtle scanline overlay */}
                      <div className="absolute inset-0 z-20 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fff, #fff 1px, transparent 1px, transparent 3px)' }} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-3">Text covers the full frame — perfect for story-style reels</p>
                </div>
              )}
            </motion.div>
          )}

          {/* RENDERING PROGRESS STATE */}
          {status === 'rendering' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-800/50 p-8 rounded-2xl border border-gray-800 text-center max-w-xl mx-auto shadow-2xl backdrop-blur relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-950">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 transition-all duration-300 animate-pulse"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center font-bold text-lg text-purple-300">
                    {progress}%
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Generating Your Reel Video</h2>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">Please wait while the AI provider, text-to-speech engine, and FFmpeg renderer compile your video.</p>

              {/* Progress Detail */}
              <div className="bg-gray-900 border border-gray-850 p-4 rounded-xl flex items-center justify-between text-left mb-6">
                <div className="flex items-center gap-3">
                  <Film className="text-purple-400 animate-pulse" size={20} />
                  <div>
                    <div className="font-semibold text-sm text-gray-300">Active Job Status</div>
                    <div className="text-xs text-gray-500 mt-0.5">{step || 'Queued in BullMQ render queue...'}</div>
                  </div>
                </div>
                <span className="bg-purple-950 border border-purple-800/30 text-purple-300 text-xs px-2.5 py-1 rounded-full font-bold">
                  Rendering
                </span>
              </div>

              {/* Linear Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Render Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-900 h-3 rounded-full overflow-hidden border border-gray-800">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* COMPLETED / SUCCESS STATE */}
          {status === 'completed' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-800/50 p-8 rounded-2xl border border-gray-800 text-center max-w-xl mx-auto shadow-2xl backdrop-blur"
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 text-green-400 rounded-full flex items-center justify-center shadow-lg shadow-green-500/5">
                  <CheckCircle size={36} />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Reel Render Complete!</h2>
              <p className="text-gray-400 mb-6">Your video has been rendered and added to the gallery successfully.</p>

              {/* Video Preview */}
              {downloadUrl && (
                <div className="bg-black rounded-xl overflow-hidden aspect-[9/16] w-64 mx-auto mb-6 border border-gray-800 shadow-2xl relative group">
                  <video
                    src={downloadUrl}
                    poster={thumbnailUrl}
                    controls
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 max-w-xs mx-auto">
                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    download={`reel-${activeReelId}.mp4`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-green-500/20"
                  >
                    <Download size={18} />
                    <span>Download MP4 File</span>
                  </a>
                )}
                <button
                  onClick={handleReset}
                  className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold flex items-center justify-center gap-2 transition"
                >
                  <RotateCcw size={18} />
                  <span>Generate Another Reel</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* FAILED / ERROR STATE */}
          {status === 'failed' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-800/50 p-8 rounded-2xl border border-gray-800 text-center max-w-xl mx-auto shadow-2xl backdrop-blur"
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 text-red-400 rounded-full flex items-center justify-center shadow-lg shadow-red-500/5">
                  <AlertCircle size={36} />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Reel Generation Failed</h2>
              <p className="text-gray-400 mb-6">We encountered an issue during the rendering process details below.</p>

              {/* Error Detail */}
              <div className="bg-red-950/20 border border-red-900/30 text-red-300 p-4 rounded-xl text-sm mb-6 text-left max-h-40 overflow-y-auto">
                <span className="font-bold block mb-1">Error message:</span>
                {errorMessage || 'Unknown background processing failure.'}
              </div>

              {/* Action Buttons */}
              <div className="max-w-xs mx-auto">
                <button
                  onClick={handleReset}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-purple-500/20"
                >
                  <RotateCcw size={18} />
                  <span>Try Again</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
