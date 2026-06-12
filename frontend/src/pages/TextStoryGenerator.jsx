import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Wand2, Sparkles, Shuffle, Volume2, Play, Check, 
  Eye, HelpCircle, ChevronLeft, ChevronRight, Music, Smartphone, User, Image
} from 'lucide-react';
import toast from 'react-hot-toast';
import useTextStoryStore from '../store/textStoryStore';

export default function TextStoryGenerator() {
  const navigate = useNavigate();
  const {
    storyText, username, avatarUrl,
    background, accentColor, animationStyle, musicTrack, sfx,
    availableStyles, screens, isLoading, isGenerating,
    setStoryText, setUsername, setAvatarUrl,
    setBackground, setAccentColor, setAnimation, setMusic, setSfx,
    randomizeAll, fetchStyles, previewStory, generateStory
  } = useTextStoryStore();

  const [currentScreenIdx, setCurrentScreenIdx] = useState(0);
  const [audioPreviewPlaying, setAudioPreviewPlaying] = useState(false);
  const [audioObj, setAudioObj] = useState(null);

  // Fetch styles on mount
  useEffect(() => {
    fetchStyles();
    return () => {
      if (audioObj) {
        audioObj.pause();
      }
    };
  }, [fetchStyles]);

  // Update preview when text, username, or avatar changes (debounced)
  useEffect(() => {
    if (storyText.trim().length > 0) {
      const timer = setTimeout(() => {
        previewStory();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [storyText, username, avatarUrl, previewStory]);

  // Adjust active screen index if screen count changes
  useEffect(() => {
    if (screens.length > 0 && currentScreenIdx >= screens.length) {
      setCurrentScreenIdx(screens.length - 1);
    }
  }, [screens, currentScreenIdx]);

  // Audio Preview Handler
  const toggleAudioPreview = () => {
    if (!musicTrack) {
      toast.error('Select a music track to preview first');
      return;
    }

    if (audioPreviewPlaying && audioObj) {
      audioObj.pause();
      setAudioPreviewPlaying(false);
      return;
    }

    // Resolve sound track name to static asset location
    // Category mapping matching backend
    const categoryMap = {
      'emotional': 'emotional_piano',
      'suspense': 'suspense_build',
      'shocking': 'betrayal_strings',
      'motivational': 'uplifting_beat',
      'horror': 'horror_ambient',
      'crime': 'revenge_epic',
      'funny': 'lofi_chill',
      'mystery': 'tense_clock'
    };

    const filename = musicTrack.name.toLowerCase() + '.mp3';
    const musicUrl = `http://localhost:5000/assets/music/${filename}`;

    if (audioObj) {
      audioObj.pause();
    }

    const audio = new Audio(musicUrl);
    audio.volume = 0.55;
    audio.play()
      .then(() => {
        setAudioPreviewPlaying(true);
      })
      .catch(() => {
        // Fallback if local file not found/loaded yet
        toast.error('Preview file not found locally. It will auto-download during render.');
      });

    audio.onended = () => setAudioPreviewPlaying(false);
    setAudioObj(audio);
  };

  useEffect(() => {
    if (audioObj) {
      audioObj.pause();
      setAudioPreviewPlaying(false);
    }
  }, [musicTrack]);

  // Submit Handler
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!storyText.trim()) {
      toast.error('Please enter a story script');
      return;
    }

    const reelId = await generateStory();
    if (reelId) {
      navigate('/downloads');
    }
  };

  // Helper to render decorative patterns in CSS
  const getPatternStyles = (patternName) => {
    switch (patternName) {
      case 'floral':
        return {
          backgroundImage: `radial-gradient(circle at 100% 150%, transparent 24%, rgba(225, 29, 72, 0.05) 24%, rgba(225, 29, 72, 0.05) 28%, transparent 28%, transparent),
                            radial-gradient(circle at 0% 150%, transparent 24%, rgba(225, 29, 72, 0.05) 24%, rgba(225, 29, 72, 0.05) 28%, transparent 28%, transparent)`,
          backgroundSize: '40px 40px'
        };
      case 'dots':
        return {
          backgroundImage: 'radial-gradient(rgba(79, 70, 229, 0.08) 2px, transparent 2px)',
          backgroundSize: '24px 24px'
        };
      case 'leaves':
        return {
          backgroundImage: 'linear-gradient(45deg, rgba(5, 150, 105, 0.05) 25%, transparent 25%), linear-gradient(-45deg, rgba(5, 150, 105, 0.05) 25%, transparent 25%)',
          backgroundSize: '30px 30px'
        };
      case 'stars':
        return {
          backgroundImage: 'radial-gradient(circle, rgba(14, 116, 144, 0.06) 10%, transparent 11%)',
          backgroundSize: '32px 32px'
        };
      case 'hearts':
        return {
          backgroundImage: `radial-gradient(circle, rgba(225, 29, 72, 0.04) 20%, transparent 20%),
                            radial-gradient(circle, rgba(225, 29, 72, 0.04) 20%, transparent 20%)`,
          backgroundPosition: '0 0, 15px 15px',
          backgroundSize: '30px 30px'
        };
      case 'waves':
        return {
          backgroundImage: 'radial-gradient(circle at 50% 100%, transparent 10px, rgba(5, 150, 105, 0.05) 10px, rgba(5, 150, 105, 0.05) 12px, transparent 12px)',
          backgroundSize: '20px 20px'
        };
      case 'sun':
        return {
          backgroundImage: 'radial-gradient(circle at top right, rgba(217, 119, 6, 0.06) 0%, transparent 70%)'
        };
      case 'marble':
        return {
          backgroundImage: 'linear-gradient(130deg, transparent 50%, rgba(0,0,0,0.02) 50%, rgba(0,0,0,0.02) 52%, transparent 52%)',
          backgroundSize: '100px 100px'
        };
      case 'navy':
        return {
          backgroundImage: 'radial-gradient(white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        };
      case 'embers':
        return {
          backgroundImage: 'radial-gradient(circle at bottom, rgba(225, 29, 72, 0.1) 0%, transparent 80%)'
        };
      default:
        return {};
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F1A] text-white p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Back navigation */}
        <div className="mb-6">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={18} />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Header Section */}
        <div className="mb-8 border-b border-gray-800 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent flex items-center gap-3">
              <Wand2 className="text-pink-500" size={32} />
              Viral Facebook Text Story Generator
            </h1>
            <p className="text-gray-400 mt-2">Create engaging, randomized Facebook-style text story video reels with highlights and transitions.</p>
          </div>

          {/* Quick Actions */}
          <button 
            type="button"
            onClick={randomizeAll}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg shadow-pink-500/10 hover:shadow-pink-500/20 transition-all border border-pink-500/25 active:scale-95"
          >
            <Shuffle size={16} />
            <span>Style Roulette 🎲</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT PANEL - Controls (7 Cols) */}
          <form onSubmit={handleGenerate} className="lg:col-span-7 space-y-6 bg-gray-900/40 p-6 rounded-2xl border border-gray-800 backdrop-blur-md">
            <div className="border-b border-gray-800 pb-3 mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-purple-400">
                <Smartphone size={20} />
                Story Setup & Design
              </h2>
            </div>

            {/* Username & Avatar URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
                  <User size={16} /> Username
                </label>
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Sarah Storyteller"
                  className="w-full bg-[#181829] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-sans"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
                  <Image size={16} /> Avatar Image URL
                </label>
                <input 
                  type="text"
                  value={avatarUrl || ''}
                  onChange={(e) => setAvatarUrl(e.target.value || null)}
                  placeholder="e.g. https://domain.com/avatar.jpg"
                  className="w-full bg-[#181829] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-sans"
                />
              </div>
            </div>

            {/* Story text script */}
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                ✍️ Story Content
              </label>
              <textarea
                rows={5}
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
                placeholder="Paste your hook-filled story script here. The engine will split it into screens automatically and highlight shock keywords/ALL-CAPS words."
                className="w-full bg-[#181829] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-sans leading-relaxed"
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                Words: {storyText.split(/\s+/).filter(Boolean).length} | Characters: {storyText.length}
              </div>
            </div>

            {/* Visual Overrides */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-bold text-gray-400">Manual Style Overrides</h3>

              {/* Background Picker */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                  Background Style
                </label>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {availableStyles.backgrounds.map((bg) => {
                    const isSelected = background?.name === bg.name;
                    return (
                      <div
                        key={bg.name}
                        onClick={() => setBackground(bg)}
                        title={bg.name.replace('_', ' ')}
                        style={{ backgroundColor: bg.color }}
                        className={`h-8 rounded-lg cursor-pointer border-2 transition-all relative flex items-center justify-center ${
                          isSelected ? 'border-purple-500 scale-110 shadow-lg' : 'border-transparent hover:border-gray-500'
                        }`}
                      >
                        {isSelected && <Check size={14} style={{ color: bg.text }} strokeWidth={3} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Accent Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                  Accent Highlights
                </label>
                <div className="flex gap-3">
                  {availableStyles.accentColors.map((color) => {
                    const isSelected = accentColor?.name === color.name;
                    return (
                      <div
                        key={color.name}
                        onClick={() => setAccentColor(color)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${
                          isSelected ? 'bg-gray-800 border-purple-500 text-white' : 'bg-[#181829] border-gray-800 text-gray-400 hover:border-gray-750'
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: color.hex }} />
                        <span className="text-xs font-semibold">{color.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Animation Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                  Text Animation Style
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableStyles.animations.map((anim) => {
                    const isSelected = animationStyle === anim.name;
                    return (
                      <div
                        key={anim.name}
                        onClick={() => setAnimation(anim.name)}
                        className={`p-2.5 rounded-xl border cursor-pointer text-center transition-all ${
                          isSelected ? 'bg-purple-600/15 border-purple-500 text-purple-200' : 'bg-[#181829] border-gray-800 text-gray-400 hover:border-gray-750'
                        }`}
                      >
                        <div className="text-xs font-bold capitalize">{anim.name.replace('_', ' ')}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Music Tracks Select & Preview */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                  Background Soundtrack
                </label>
                <div className="flex gap-2">
                  <select
                    value={musicTrack?.name || ''}
                    onChange={(e) => {
                      const matched = availableStyles.musicTracks.find(m => m.name === e.target.value);
                      if (matched) setMusic(matched);
                    }}
                    className="flex-1 bg-[#181829] border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 capitalize"
                  >
                    {availableStyles.musicTracks.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.name.replace('_', ' ')} (BPM: {m.bpm})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={toggleAudioPreview}
                    className={`px-4 rounded-xl border flex items-center justify-center transition-all ${
                      audioPreviewPlaying
                        ? 'bg-pink-600 text-white border-pink-500 shadow-md shadow-pink-500/20'
                        : 'bg-[#181829] hover:bg-gray-800 border-gray-800 text-pink-400'
                    }`}
                    title="Preview Soundtrack"
                  >
                    {audioPreviewPlaying ? <Volume2 size={16} className="animate-bounce" /> : <Play size={14} />}
                  </button>
                </div>
              </div>

              {/* SFX Checkbox Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                  Interactive Sound Effects
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableStyles.sfxOptions.map((sfxOpt) => {
                    const isSelected = sfx.includes(sfxOpt.name);
                    return (
                      <div
                        key={sfxOpt.name}
                        onClick={() => {
                          if (isSelected) {
                            setSfx(sfx.filter(item => item !== sfxOpt.name));
                          } else {
                            setSfx([...sfx, sfxOpt.name]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all capitalize ${
                          isSelected ? 'bg-pink-600/15 border-pink-500 text-pink-300 font-bold' : 'bg-[#181829] border-gray-800 text-gray-500 hover:border-gray-750'
                        }`}
                      >
                        🔔 {sfxOpt.name.replace('_sfx', '').replace('_', ' ')}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Submit Generation Button */}
            <button
              type="submit"
              disabled={isGenerating || !storyText.trim()}
              className="w-full py-4 mt-4 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-40 select-none cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Queuing Render Job...</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} className="animate-pulse" />
                  <span>Generate Text Story Reel</span>
                </>
              )}
            </button>
          </form>

          {/* RIGHT PANEL - Realtime Interactive Preview (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center bg-gray-900/20 border border-gray-850 p-6 rounded-2xl backdrop-blur-md">
            <div className="text-center mb-4 flex items-center gap-1.5">
              <span className="text-xs uppercase bg-pink-950 border border-pink-900/40 text-pink-400 px-3 py-1 rounded-full font-bold tracking-wider inline-flex items-center gap-1.5">
                <Eye size={12} />
                Live Story Preview
              </span>
              {screens.length > 1 && (
                <span className="text-xs font-bold text-gray-500 bg-gray-800/40 px-2 py-0.5 rounded border border-gray-800">
                  {currentScreenIdx + 1} / {screens.length} Screens
                </span>
              )}
            </div>

            {/* Premium 9:16 Phone Mockup Container */}
            <div className="relative border-[8px] border-gray-800 rounded-[38px] w-[300px] h-[533px] overflow-hidden bg-black shadow-2xl flex flex-col justify-between select-none">
              
              {/* Camera Speaker Notch */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-24 h-4 bg-gray-800 rounded-full z-30" />
              
              {/* Dynamic Styled Background and Patterns */}
              <div 
                className="absolute inset-0 z-0 transition-colors duration-500" 
                style={{ backgroundColor: background?.color || '#FFE4E8' }}
              />

              {/* Subtle Pattern Overlay */}
              <div 
                className="absolute inset-0 z-10 opacity-100 transition-all duration-500 pointer-events-none"
                style={background ? getPatternStyles(background.pattern) : {}}
              />

              {/* CONTENT WRAPPER */}
              <div className="z-20 flex flex-col justify-between h-full p-5 pt-8">
                
                {/* Facebook Text Story Header */}
                <div className="flex items-center gap-3 border-b border-gray-300/10 pb-3">
                  {/* Avatar circle */}
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20 flex items-center justify-center bg-gradient-to-tr from-pink-500 to-indigo-500 text-white font-black text-lg shadow">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      username.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-[15px] leading-tight" style={{ color: background?.text || '#1A1A1A' }}>
                      {username || 'Sarah Storyteller'}
                    </h4>
                    <div className="flex items-center gap-1 text-[11px] opacity-70" style={{ color: background?.text || '#1A1A1A' }}>
                      <span>2hrs ago</span>
                      <span>•</span>
                      <span>👥</span>
                      <span>•</span>
                      <span className="italic">A Text Story</span>
                    </div>
                  </div>
                </div>

                {/* Animated Text Body */}
                <div className="flex-1 flex flex-col justify-start pt-6 overflow-hidden">
                  {screens.length > 0 ? (
                    <div className="space-y-3 leading-relaxed">
                      {screens[currentScreenIdx]?.segments.map((seg, sIdx) => {
                        const isDialogue = seg.style === 'dialogue';
                        const isAccent = seg.style === 'accent';
                        
                        let textColor = background?.text || '#1A1A1A';
                        let fontWeight = 'font-bold';
                        let fontStyle = '';

                        if (isAccent || isDialogue) {
                          textColor = accentColor?.hex || '#B22222';
                          fontWeight = 'font-extrabold';
                        }
                        if (isDialogue) {
                          fontStyle = 'italic';
                        }

                        if (seg.style === 'cta') {
                          return null; // Don't render cta inside main body, it's rendered separately below
                        }

                        return (
                          <span 
                            key={sIdx} 
                            style={{ color: textColor }}
                            className={`${fontWeight} ${fontStyle} text-[15px] font-sans`}
                          >
                            {seg.text}
                          </span>
                        );
                      })}

                      {/* Screen cliffhanger / CTA indicator */}
                      <div className="text-right pt-4">
                        <span 
                          style={{ color: accentColor?.hex || '#B22222' }}
                          className="font-black text-xs uppercase tracking-wider bg-white/40 border border-black/5 px-2.5 py-1 rounded"
                        >
                          Read More.....
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                      <span className="text-3xl mb-2 animate-bounce">✍️</span>
                      <p className="text-xs" style={{ color: background?.text || '#1A1A1A' }}>
                        Start typing story content in the left panel to load the real-time card layout preview.
                      </p>
                    </div>
                  )}
                </div>

                {/* Simulated Bottom Navigation (left/right arrows) for multi-screen stories */}
                {screens.length > 1 && (
                  <div className="flex justify-between items-center py-2 px-1 z-20">
                    <button 
                      type="button"
                      disabled={currentScreenIdx === 0}
                      onClick={() => setCurrentScreenIdx(currentScreenIdx - 1)}
                      className="p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-[10px] font-bold bg-black/35 px-3 py-1 rounded-full text-white">
                      Screen {currentScreenIdx + 1} of {screens.length}
                    </span>
                    <button 
                      type="button"
                      disabled={currentScreenIdx === screens.length - 1}
                      onClick={() => setCurrentScreenIdx(currentScreenIdx + 1)}
                      className="p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}

                {/* Facebook Story Maroon Footer Bar */}
                <div className="w-full bg-[#2D0000] border-t border-black/25 py-2.5 rounded-md mt-4 flex items-center justify-center shadow-md">
                  <span className="text-white text-xs font-black tracking-wide text-center uppercase flex items-center gap-1 select-none">
                    Full Story In First Comment 👇
                  </span>
                </div>

              </div>

            </div>

            {/* Quick Metadata Info */}
            <div className="mt-4 flex flex-col gap-1 items-center text-center">
              <span className="text-xs text-gray-400 capitalize">
                🎬 Music: {musicTrack ? musicTrack.name.replace('_', ' ') : 'None'}
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1 font-bold">
                ⚡ Animation: <span className="text-purple-400 capitalize">{animationStyle || 'None'}</span>
              </span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
