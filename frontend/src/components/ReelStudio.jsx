import React from 'react';
import { THEMES } from '../remotion/Themes';
import { Palette, Mic, Music, Volume2, VolumeX, PlayCircle, Loader2 } from 'lucide-react';
import BackgroundSelector from './BackgroundSelector';

const THEME_ORDER = ['horror', 'mystery', 'crime', 'emotional', 'tiktok', 'dark', 'suspense'];

const ReelStudio = ({
  selectedTheme,
  onThemeChange,
  customSubtitleColor,
  onSubtitleColorChange,
  subtitleSize,
  onSubtitleSizeChange,
  subtitlePosition,
  onSubtitlePositionChange,
  overlayOpacity,
  onOverlayOpacityChange,
  zoomSpeed,
  onZoomSpeedChange,
  grainOpacity,
  onGrainOpacityChange,
  glowIntensity,
  onGlowIntensityChange,
  ttsEnabled,
  onTtsToggle,
  voiceLanguage,
  onVoiceLanguageChange,
  musicEnabled,
  onMusicToggle,
  duration,
  onDurationChange,
  categories = [],
  selectedCategory = 'all',
  onCategoryChange,
  renderingEngine = 'remotion',
  onRenderingEngineChange,
  bgSettings,
  onBgSettingsChange,
  onGenerate,
  isGenerating,
}) => (
  <div className="w-full md:w-96 bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 h-fit">
    <h2 className="text-xl font-bold mb-6 border-b border-gray-700 pb-2 flex items-center gap-2">
      <Palette size={20} className="text-purple-400" /> Reel Studio
    </h2>

    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-400 mb-2">Theme</label>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {THEME_ORDER.map((themeKey) => (
          <button
            key={themeKey}
            type="button"
            onClick={() => onThemeChange(themeKey)}
            className={`flex-shrink-0 w-24 rounded-lg border-2 p-2 transition ${
              selectedTheme === themeKey
                ? 'border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.6)]'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <div className="h-12 rounded mb-1" style={{ background: THEMES[themeKey].secondaryColor }} />
            <span className="text-xs font-medium block truncate">{THEMES[themeKey].name}</span>
          </button>
        ))}
      </div>
    </div>

    <div className="mb-6">
      <BackgroundSelector value={bgSettings} onChange={onBgSettingsChange} />
    </div>

    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-1.5">
        📂 Content Category
      </label>
      <select
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="w-full bg-gray-900 border border-gray-600 rounded p-2.5 text-sm text-white font-medium focus:ring-2 focus:ring-purple-500"
      >
        <option value="all">🔄 Shuffle All Articles</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            📖 {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </option>
        ))}
      </select>
      <p className="text-2xs text-gray-500 mt-1">
        Only shuffle and generate stories from the selected category.
      </p>
    </div>

    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-1.5">
        ⚡ Rendering Engine & Pipeline
      </label>
      <select
        value={renderingEngine}
        onChange={(e) => onRenderingEngineChange(e.target.value)}
        className="w-full bg-gray-900 border border-gray-600 rounded p-2.5 text-sm text-white font-medium focus:ring-2 focus:ring-purple-500"
      >
        <option value="remotion">🎬 Local Remotion Render Engine (Free & Native)</option>
        <option value="canva_business">💎 Canva Business Cloud API (Unlimited High-Speed)</option>
        <option value="canva_free">🎨 Canva Free Preset Cloud</option>
        <option value="capcut_api">🎥 CapCut Enterprise API (ByteDance Cloud)</option>
        <option value="capcut_free">⚙️ CapCut Free Preset Automation</option>
      </select>
      <p className="text-2xs text-gray-500 mt-1">
        Distribute rendering load globally so your generation pipeline never gets rate-limited.
      </p>
    </div>

    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-400 mb-2">Subtitle color</label>
      <input
        type="color"
        value={customSubtitleColor}
        onChange={(e) => onSubtitleColorChange(e.target.value)}
        className="w-full h-10 rounded cursor-pointer bg-gray-900 border border-gray-600"
      />
      <label className="block text-xs text-gray-400 mt-3 mb-1">Font size ({subtitleSize}px)</label>
      <input
        type="range"
        min="24"
        max="72"
        value={subtitleSize}
        onChange={(e) => onSubtitleSizeChange(Number(e.target.value))}
        className="w-full"
      />
      <div className="flex gap-2 mt-2">
        {['top', 'center', 'bottom'].map((pos) => (
          <button
            key={pos}
            type="button"
            onClick={() => onSubtitlePositionChange(pos)}
            className={`flex-1 py-1.5 text-xs rounded capitalize ${
              subtitlePosition === pos ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {pos}
          </button>
        ))}
      </div>
    </div>

    <div className="mb-6 space-y-3">
      <p className="text-sm font-medium text-gray-400">Effects</p>
      {[
        ['Overlay Opacity', overlayOpacity, onOverlayOpacityChange],
        ['Zoom Speed', zoomSpeed, onZoomSpeedChange],
        ['Film Grain', grainOpacity, onGrainOpacityChange],
        ['Glow Intensity', glowIntensity, onGlowIntensityChange],
      ].map(([label, val, setter]) => (
        <div key={label}>
          <label className="block text-xs text-gray-400">{label} ({val}%)</label>
          <input
            type="range"
            min="0"
            max="100"
            value={val}
            onChange={(e) => setter(Number(e.target.value))}
            className="w-full"
          />
        </div>
      ))}
    </div>

    <div className="mb-4 flex items-center justify-between p-3 bg-gray-900 border border-gray-600 rounded-lg">
      <span className="text-sm text-gray-300 flex items-center gap-2">
        <Mic size={14} /> Voice-over (TTS)
      </span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only peer" checked={ttsEnabled} onChange={onTtsToggle} />
        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500" />
      </label>
    </div>
    {ttsEnabled && (
      <select
        value={voiceLanguage}
        onChange={(e) => onVoiceLanguageChange(e.target.value)}
        className="w-full mb-4 bg-gray-900 border border-gray-600 rounded p-2 text-sm"
      >
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
      </select>
    )}

    <div className="mb-6 flex items-center justify-between p-3 bg-gray-900 border border-gray-600 rounded-lg">
      <span className="text-sm text-gray-300 flex items-center gap-2">
        {musicEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
        <Music size={14} className="text-yellow-400" /> Background Music
      </span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only peer" checked={musicEnabled} onChange={onMusicToggle} />
        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 peer-checked:bg-yellow-500" />
      </label>
    </div>

    <div className="mb-6 p-4 bg-gray-900 border border-purple-500/30 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-300">Video Duration</label>
        <span className="text-purple-400 font-bold">{duration}s</span>
      </div>
      <input
        type="range"
        min="7"
        max="30"
        value={duration}
        onChange={(e) => onDurationChange(Number(e.target.value))}
        className="w-full accent-purple-500"
      />
      <div className="flex justify-between text-[10px] text-gray-500 mt-1">
        <span>7s (Fast)</span>
        <span>30s (Deep)</span>
      </div>
    </div>

    <button
      type="button"
      onClick={onGenerate}
      disabled={isGenerating}
      className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 py-3 rounded-lg font-bold flex items-center justify-center gap-2"
    >
      {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <PlayCircle size={20} />}
      {isGenerating ? 'Generating...' : 'Generate Reel'}
    </button>
  </div>
);

export default ReelStudio;
