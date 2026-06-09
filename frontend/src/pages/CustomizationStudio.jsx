import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Player } from '@remotion/player';
import { ReelComposition } from '../remotion/ReelComposition';
import { THEMES } from '../remotion/Themes';
import ReelStudio from '../components/ReelStudio';
import useReelStore from '../store/reelStore';

const MOCK_SCENES = [
  { text: 'A chilling discovery...', start_time: 0, duration: 3, type: 'hook' },
  { text: 'Deep in the woods.', start_time: 3, duration: 3, type: 'beat' },
  { text: 'No one could believe it.', start_time: 6, duration: 2, type: 'cliffhanger' },
  { text: '📖 Full Read Story Details In Comments 👇', start_time: 8, duration: 2, type: 'cta' },
];

const MOCK_IMAGE =
  'https://images.unsplash.com/photo-1505635552518-3448ff116af3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80';

import useSourceStore from '../store/sourceStore';

const CustomizationStudio = () => {
  const navigate = useNavigate();
  const { generateReel, isGenerating } = useReelStore();
  const { sources, fetchSources } = useSourceStore();
  
  const [selectedTheme, setSelectedTheme] = useState('horror');
  const [customSubtitleColor, setCustomSubtitleColor] = useState(THEMES.horror.subtitleColor);
  const [subtitleSize, setSubtitleSize] = useState(52);
  const [subtitlePosition, setSubtitlePosition] = useState('bottom');
  const [overlayOpacity, setOverlayOpacity] = useState(70);
  const [glowIntensity, setGlowIntensity] = useState(50);
  const [zoomSpeed, setZoomSpeed] = useState(50);
  const [grainOpacity, setGrainOpacity] = useState(40);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [voiceLanguage, setVoiceLanguage] = useState('en');
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [duration, setDuration] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [renderingEngine, setRenderingEngine] = useState('remotion');
  const [bgSettings, setBgSettings] = useState({ bgType: 'pixabay', customImagePath: null });

  React.useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  // Extract all unique manually added categories from website sources
  const categories = React.useMemo(() => {
    const catSet = new Set();
    sources.forEach(s => {
      if (s.category_name) {
        // Support both single and comma-separated categories
        s.category_name.split(',').forEach(c => {
          const trimmed = c.trim().toLowerCase();
          if (trimmed) catSet.add(trimmed);
        });
      }
    });
    return Array.from(catSet);
  }, [sources]);

  const handleThemeChange = (themeKey) => {
    setSelectedTheme(themeKey);
    setCustomSubtitleColor(THEMES[themeKey].subtitleColor);
  };

  const handleGenerate = async () => {
    const result = await generateReel(selectedTheme, {
      subtitleColor: customSubtitleColor,
      subtitleSize,
      subtitlePosition,
      overlayOpacity: overlayOpacity / 100,
      glowIntensity: glowIntensity / 100,
      zoomSpeed: zoomSpeed / 100,
      grainOpacity: grainOpacity / 100,
      ttsEnabled,
      voiceLanguage,
      musicEnabled,
      renderingEngine,
    }, duration, selectedCategory, bgSettings.bgType, bgSettings.customImagePath);
    if (result?.reelId) navigate('/downloads');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-900 text-white flex flex-col md:flex-row gap-8">
      <div className="flex-1 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-6 text-blue-400">Reel Customization Studio</h1>
        <div className="rounded-xl overflow-hidden shadow-2xl border-4 border-gray-800">
          <Player
            component={ReelComposition}
            inputProps={{
              scenes: MOCK_SCENES,
              theme: selectedTheme,
              imageUrl: MOCK_IMAGE,
              customization: {
                subtitleColor: customSubtitleColor,
                subtitleSize,
                overlayOpacity: overlayOpacity / 100,
                glowIntensity: glowIntensity / 100,
                zoomSpeed: zoomSpeed / 100,
                grainOpacity: grainOpacity / 100,
              },
            }}
            durationInFrames={300}
            compositionWidth={1080}
            compositionHeight={1920}
            fps={30}
            style={{ width: '320px', height: '568px' }}
            controls
            loop
            autoPlay
          />
        </div>
      </div>

      <ReelStudio
        selectedTheme={selectedTheme}
        onThemeChange={handleThemeChange}
        customSubtitleColor={customSubtitleColor}
        onSubtitleColorChange={setCustomSubtitleColor}
        subtitleSize={subtitleSize}
        onSubtitleSizeChange={setSubtitleSize}
        subtitlePosition={subtitlePosition}
        onSubtitlePositionChange={setSubtitlePosition}
        overlayOpacity={overlayOpacity}
        onOverlayOpacityChange={setOverlayOpacity}
        zoomSpeed={zoomSpeed}
        onZoomSpeedChange={setZoomSpeed}
        grainOpacity={grainOpacity}
        onGrainOpacityChange={setGrainOpacity}
        glowIntensity={glowIntensity}
        onGlowIntensityChange={setGlowIntensity}
        ttsEnabled={ttsEnabled}
        onTtsToggle={() => setTtsEnabled(!ttsEnabled)}
        voiceLanguage={voiceLanguage}
        onVoiceLanguageChange={setVoiceLanguage}
        musicEnabled={musicEnabled}
        onMusicToggle={() => setMusicEnabled(!musicEnabled)}
        duration={duration}
        onDurationChange={setDuration}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        renderingEngine={renderingEngine}
        onRenderingEngineChange={setRenderingEngine}
        bgSettings={bgSettings}
        onBgSettingsChange={setBgSettings}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
      />
    </div>
  );
};

export default CustomizationStudio;
