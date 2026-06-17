import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { 
  Play, Pause, Music, Mic, Clock, Sparkles, Wand2, ArrowLeft,
  Volume2, VolumeX, Layers, MessageSquare, Check, Eye
} from 'lucide-react';
import useReelStore from '../store/reelStore';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = API_URL.replace('/api', '');

const THEMES = [
  { id: 'suspense', label: 'Suspense', desc: 'Moody deep purples and high-blur transitions', color: 'from-purple-900 via-indigo-950 to-black', border: 'border-purple-500' },
  { id: 'horror', label: 'Horror', desc: 'Cinematic blood-red text overlays and shadows', color: 'from-red-950 via-gray-950 to-black', border: 'border-red-500' },
  { id: 'modern', label: 'Modern', desc: 'Clean, professional design with bright cyan overlays', color: 'from-blue-900 via-slate-900 to-black', border: 'border-cyan-500' },
  { id: 'minimal', label: 'Minimal', desc: 'Simple white typography centered on black background', color: 'from-gray-900 to-black', border: 'border-gray-500' },
  { id: 'bold', label: 'Bold', desc: 'Heavy yellow lettering with high-energy movement', color: 'from-yellow-950 via-zinc-900 to-black', border: 'border-yellow-500' }
];

const VOICES = [
  { id: 'Jenny', name: 'Jenny (Female)', gender: 'female', info: 'Emotional, deep storytelling voice' },
  { id: 'Aria', name: 'Aria (Female)', gender: 'female', info: 'Conversational, clear US accent' },
  { id: 'Guy', name: 'Guy (Male)', gender: 'male', info: 'Deep, crisp, narrative voice' },
  { id: 'Michelle', name: 'Michelle (Neutral)', gender: 'neutral', info: 'Calm, steady, storytelling voice' },
  { id: 'none', name: 'Silent (No Voiceover)', gender: 'none', info: 'Export without narration' }
];

const TONES = [
  { id: 'professional', label: '👔 Professional', desc: 'Serious, informative, and authoritative tone' },
  { id: 'casual', label: '☕ Casual', desc: 'Friendly, easygoing, and conversational style' },
  { id: 'energetic', label: '⚡ Energetic', desc: 'Exciting, rapid-paced, and highly engaging' }
];

export default function ReelStudio() {
  const navigate = useNavigate();
  const { generateReel, isGenerating } = useReelStore();

  // Form states
  const [selectedTheme, setSelectedTheme] = useState('suspense');
  const [selectedMusic, setSelectedMusic] = useState('none');
  const [selectedVoice, setSelectedVoice] = useState('Jenny');
  const [duration, setDuration] = useState(30);
  const [selectedTone, setSelectedTone] = useState('casual');
  const [customText, setCustomText] = useState('');
  const [textStoryMode, setTextStoryMode] = useState(false); // Full page text story display

  // Audio preview states
  const [musicTracks, setMusicTracks] = useState([]);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const audioRef = useRef(null);

  // Load music tracks from backend
  useEffect(() => {
    const fetchMusic = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/reels/music`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMusicTracks(res.data || []);
      } catch (err) {
        console.warn('Failed to load music tracks:', err.message);
      } finally {
        setLoadingTracks(false);
      }
    };
    fetchMusic();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Handle music preview toggle
  const toggleMusicPreview = () => {
    if (selectedMusic === 'none') {
      toast.error('Please select a track to preview first!');
      return;
    }

    if (previewPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPreviewPlaying(false);
      return;
    }

    const track = musicTracks.find(t => t.id === selectedMusic || t.id.toString() === selectedMusic.toString());
    if (!track || !track.file_path) return;

    // Resolve static music path
    const match = track.file_path.match(/music[/\\](.+)/i);
    const musicUrl = match 
      ? `${BASE_URL}/assets/music/${match[1].replace(/\\/g, '/')}` 
      : null;

    if (!musicUrl) {
      toast.error('Track URL resolution failed');
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(musicUrl);
    audio.volume = 0.5;
    audio.play()
      .then(() => {
        setPreviewPlaying(true);
      })
      .catch((err) => {
        console.error('Audio playback blocked:', err);
        toast.error('Failed to play audio preview.');
      });

    audio.onended = () => setPreviewPlaying(false);
    audioRef.current = audio;
  };

  // Trigger preview state reload when music choice changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPreviewPlaying(false);
    }
  }, [selectedMusic]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!customText.trim()) {
      toast.error('Please add the story script content!');
      return;
    }

    const customization = {
      voice: selectedVoice,
      musicId: selectedMusic,
      musicEnabled: selectedMusic !== 'none',
      tone: selectedTone,
      renderingEngine: 'remotion',
      textStoryMode
    };

    const result = await generateReel(
      selectedTheme,
      customization,
      parseInt(duration, 10),
      'all',
      'none',
      null,
      customText
    );

    if (result?.reelId) {
      navigate('/downloads');
    }
  };

  // Preview subtitles text sequence based on theme
  const getSubtitlesText = () => {
    if (selectedTheme === 'suspense') return 'A dark secret was buried deep...';
    if (selectedTheme === 'horror') return 'DON\'T LOOK BEHIND YOU!';
    if (selectedTheme === 'bold') return 'THINK FAST! ACT NOW!';
    if (selectedTheme === 'modern') return 'The future of story creation.';
    return 'Simplicity is elegance.';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back navigation */}
        <div className="mb-6">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition">
            <ArrowLeft size={18} />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Title */}
        <div className="mb-8 border-b border-gray-800 pb-5">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent flex items-center gap-3">
            <Wand2 className="text-purple-500" size={32} />
            Reel Customization Studio
          </h1>
          <p className="text-gray-400 mt-2">Tune your story parameters, select your background music and voice overlays, and generate a customized Remotion video reel.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT PANEL - Customization Options (7 Cols) */}
          <form onSubmit={handleGenerate} className="lg:col-span-7 space-y-6 bg-gray-800/40 p-6 rounded-2xl border border-gray-800 backdrop-blur">
            <h2 className="text-xl font-bold flex items-center gap-2 border-b border-gray-700 pb-3 mb-4">
              <Layers className="text-purple-400" size={20} />
              Reel Customization Options
            </h2>

            {/* Full Page Text Story Mode Toggle */}
            <div
              onClick={() => setTextStoryMode(!textStoryMode)}
              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all select-none ${
                textStoryMode
                  ? 'bg-gradient-to-r from-purple-950/40 to-pink-950/30 border-purple-500 shadow-lg shadow-purple-500/10'
                  : 'bg-gray-900 border-gray-750 hover:border-gray-650'
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
                  <div className="text-xs text-gray-500 mt-0.5">Text fills the entire screen — bold story text on colored background, no video</div>
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

            {/* Custom script input */}
            <div>
              <label htmlFor="storyScript" className="block text-sm font-semibold text-gray-400 mb-2">
                ✍️ Story Script / Text
              </label>
              <textarea
                id="storyScript"
                rows={4}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Enter the storytelling scenes script text to generate your video..."
                className="w-full bg-gray-900 border border-gray-705 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-sans"
              />
            </div>

            {/* Theme Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-3">
                🎨 Visual Theme
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {THEMES.map((theme) => {
                  const isActive = selectedTheme === theme.id;
                  return (
                    <div
                      key={theme.id}
                      onClick={() => setSelectedTheme(theme.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all relative ${
                        isActive
                          ? `bg-gray-800/80 border-purple-500 shadow-lg shadow-purple-500/5`
                          : 'bg-gray-900 border-gray-750 hover:border-gray-650'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-sm text-gray-100">{theme.label}</span>
                        {isActive && (
                          <span className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-white scale-90">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{theme.desc}</p>
                      
                      {/* Simulated theme bar */}
                      <div className={`mt-2 h-1 w-full rounded bg-gradient-to-r ${theme.color}`} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Music Selector with Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="musicSelect" className="block text-sm font-semibold text-gray-400 mb-2">
                  🎵 Background Music
                </label>
                <div className="flex gap-2">
                  {loadingTracks ? (
                    <div className="flex-1 h-11 bg-gray-900 border border-gray-750 rounded-xl animate-pulse" />
                  ) : (
                    <select
                      id="musicSelect"
                      value={selectedMusic}
                      onChange={(e) => setSelectedMusic(e.target.value)}
                      className="flex-1 bg-gray-900 border border-gray-750 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="none">No background music</option>
                      {musicTracks.map((track) => (
                        <option key={track.id} value={track.id}>
                          {track.filename.replace(/\.[^.]+$/, '').replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  )}
                  
                  {selectedMusic !== 'none' && (
                    <button
                      type="button"
                      onClick={toggleMusicPreview}
                      className={`px-4 rounded-xl border flex items-center justify-center transition-all ${
                        previewPlaying
                          ? 'bg-pink-650 text-white border-pink-500 shadow-md shadow-pink-500/10'
                          : 'bg-gray-900 hover:bg-gray-750 border-gray-750 text-pink-400'
                      }`}
                      title="Preview Track"
                    >
                      {previewPlaying ? <Volume2 size={18} className="animate-bounce" /> : <Play size={16} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Voice Selector */}
              <div>
                <label htmlFor="voiceSelect" className="block text-sm font-semibold text-gray-400 mb-2">
                  🎙️ Voice Narrator
                </label>
                <select
                  id="voiceSelect"
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-750 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {VOICES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} — {v.info}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Target Duration Button Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                  ⏱️ Target Duration
                </label>
                <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-750">
                  {[15, 30, 60].map((d) => {
                    const isActive = duration === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDuration(d)}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                          isActive
                            ? 'bg-purple-650 text-white shadow'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {d}s
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tone Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                  🎭 Generation Tone
                </label>
                <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-750">
                  {TONES.map((t) => {
                    const isActive = selectedTone === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTone(t.id)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all capitalize ${
                          isActive
                            ? 'bg-purple-650 text-white shadow'
                            : 'text-gray-400 hover:text-white'
                        }`}
                        title={t.desc}
                      >
                        {t.label.split(' ')[1]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-4 mt-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Generation Job...</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>Generate Custom Reel</span>
                </>
              )}
            </button>
          </form>

          {/* RIGHT PANEL - Live Preview (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center bg-gray-800/20 border border-gray-800 p-6 rounded-2xl backdrop-blur">
            <div className="text-center mb-4">
              <span className="text-xs uppercase bg-purple-950 border border-purple-800/40 text-purple-300 px-3 py-1 rounded-full font-bold tracking-wider inline-flex items-center gap-1.5">
                <Eye size={12} />
                {textStoryMode ? 'Text Story Preview' : 'Live Preview Mockup'}
              </span>
            </div>

            {/* Premium Phone Mockup */}
            <div className="relative border-[8px] border-gray-850 rounded-[36px] w-[260px] h-[460px] overflow-hidden bg-black shadow-2xl flex flex-col justify-between p-4 group">
              {/* Phone Speaker/Camera Notch */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-20 h-4 bg-gray-850 rounded-full z-20" />
              
              {/* Theme background */}
              <div className={`absolute inset-0 bg-gradient-to-b ${
                THEMES.find(t => t.id === selectedTheme)?.color || 'from-purple-950 to-black'
              } opacity-80 z-0 transition-all duration-700`} />

              {textStoryMode ? (
                /* Full Page Text Story Preview */
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center">
                  <div className={`text-sm font-black leading-relaxed uppercase tracking-wide ${
                    selectedTheme === 'horror' ? 'text-red-400' :
                    selectedTheme === 'bold' ? 'text-yellow-400' :
                    selectedTheme === 'modern' ? 'text-cyan-300' :
                    selectedTheme === 'minimal' ? 'text-white' :
                    'text-purple-300'
                  }`}>
                    {customText.trim()
                      ? customText.substring(0, 200) + (customText.length > 200 ? '...' : '')
                      : 'Your story text will fill the entire screen — bold typography, no background video.'}
                  </div>
                  <div className="mt-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Full Page Text Story</div>
                </div>
              ) : (
                <>
                  {/* Watermark Logo */}
                  <div className="z-10 flex justify-between items-center text-[10px] text-gray-500/70 font-semibold mt-2">
                    <span>⚡ ReelsPro Studio</span>
                    <span>Category: Custom</span>
                  </div>

                  {/* Subtitles Overlay Panel */}
                  <div className="z-10 flex flex-col items-center justify-center flex-1 py-8 px-2 text-center select-none">
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-xl">
                      🎬
                    </div>
                    
                    {/* Highlighted text styling based on selected theme */}
                    <motion.p
                      key={selectedTheme}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`text-base font-extrabold uppercase tracking-wide px-3 py-1 bg-black/40 rounded border backdrop-blur-sm ${
                        selectedTheme === 'horror' ? 'text-red-500 border-red-900 font-serif' :
                        selectedTheme === 'bold' ? 'text-yellow-400 border-yellow-900 font-black' :
                        selectedTheme === 'modern' ? 'text-cyan-400 border-blue-900 font-sans' :
                        selectedTheme === 'minimal' ? 'text-white border-gray-800 font-sans' :
                        'text-purple-400 border-purple-900 font-serif'
                      }`}
                    >
                      {getSubtitlesText()}
                    </motion.p>
                  </div>

                  {/* Bottom simulated metadata */}
                  <div className="z-10 space-y-2 border-t border-white/5 pt-2">
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span className="font-semibold text-white/95">@reels_creator</span>
                      <span>Audio: {selectedMusic === 'none' ? 'None' : 'Library Track'}</span>
                    </div>
                    
                    {/* Progress simulator bar */}
                    <div className="w-full bg-white/10 h-1 rounded overflow-hidden">
                      <div className="bg-purple-500 h-full w-1/3 animate-pulse" />
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <p className="text-xs text-gray-500 mt-4 text-center max-w-[280px] leading-relaxed">
              {textStoryMode
                ? 'Text Story Mode: Bold text will fill the entire video frame — perfect for viral story reels.'
                : 'Visual details, text overlay transitions, and voice parameters will be rendered exactly on the server after submitting.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
