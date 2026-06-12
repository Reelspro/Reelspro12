import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { BackgroundStyle, getPatternCSS } from './textStoryBackgrounds';

export interface TextSegment {
  text: string;
  style: 'normal' | 'accent' | 'dialogue' | 'cta';
}

export interface TextStoryScreenProps {
  rawText: string;
  segments: TextSegment[];
  background: BackgroundStyle;
  accentColor: { name: string; hex: string };
  animationStyle: string;
  username: string;
  avatarUrl?: string;
  footerText: string;
}

export const TextStoryScreen: React.FC<TextStoryScreenProps> = ({
  segments,
  background,
  accentColor,
  animationStyle,
  username,
  avatarUrl,
  footerText
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Heartbeat scale oscillation
  let scale = 1.0;
  if (animationStyle === 'heartbeat') {
    const scaleFactor = Math.sin((frame / fps) * Math.PI * 2) * 0.008; // subtle oscillation
    scale = 1.0 + scaleFactor;
  }

  // Spotlight vignette class or styling
  const spotlightStyle: React.CSSProperties = animationStyle === 'spotlight' ? {
    boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5)',
    filter: 'brightness(1.15) contrast(1.05)'
  } : {};

  // Build segments with typewriter or animation reveal
  const renderSegments = () => {
    let charOffset = 0;
    const totalCharsReveal = Math.floor(frame * 1.5); // typewriter speed: ~1.5 chars per frame

    return segments.map((seg, idx) => {
      const isDialogue = seg.style === 'dialogue';
      const isAccent = seg.style === 'accent';

      let textColor = background.text || '#1A1A1A';
      let fontWeight: 'bold' | 'bolder' = 'bold';
      let fontStyle = '';

      if (isAccent || isDialogue) {
        textColor = accentColor.hex || '#B22222';
        fontWeight = 'bolder';
      }
      if (isDialogue) {
        fontStyle = 'italic';
      }

      // Animations logic
      if (animationStyle === 'typewriter') {
        const segStart = charOffset;
        const segEnd = charOffset + seg.text.length;
        charOffset = segEnd;

        if (totalCharsReveal < segStart) return null;
        
        const visibleLen = Math.min(seg.text.length, totalCharsReveal - segStart);
        const visibleText = seg.text.substring(0, visibleLen);

        return (
          <span
            key={idx}
            style={{ color: textColor, fontStyle }}
            className={`font-sans text-[42px] leading-[1.45] font-${fontWeight}`}
          >
            {visibleText}
          </span>
        );
      }

      if (animationStyle === 'zoom_punch' && (isAccent || isDialogue)) {
        // Bounce scale on entry
        const scaleSpring = spring({
          frame: frame - idx * 8,
          fps,
          config: { damping: 12, mass: 0.5 }
        });
        const currentScale = interpolate(scaleSpring, [0, 1], [0.8, 1.0]);
        const opacity = interpolate(scaleSpring, [0, 1], [0, 1]);

        return (
          <span
            key={idx}
            style={{ 
              color: textColor, 
              fontStyle, 
              display: 'inline-block',
              transform: `scale(${currentScale})`,
              opacity
            }}
            className={`font-sans text-[42px] leading-[1.45] font-${fontWeight}`}
          >
            {seg.text}
          </span>
        );
      }

      // Default/Fade/Slide animations
      const segmentSpring = spring({
        frame: frame - idx * 6,
        fps,
        config: { damping: 15 }
      });

      const translateY = animationStyle === 'slide_up'
        ? interpolate(segmentSpring, [0, 1], [30, 0])
        : 0;

      const opacity = animationStyle === 'fade_paragraphs' || animationStyle === 'slide_up'
        ? interpolate(segmentSpring, [0, 1], [0, 1])
        : 1;

      return (
        <span
          key={idx}
          style={{ 
            color: textColor, 
            fontStyle,
            opacity,
            transform: translateY !== 0 ? `translateY(${translateY}px)` : undefined,
            display: translateY !== 0 || opacity !== 1 ? 'inline-block' : 'inline'
          }}
          className={`font-sans text-[42px] leading-[1.45] font-${fontWeight}`}
        >
          {seg.text}
        </span>
      );
    });
  };

  return (
    <AbsoluteFill 
      style={{ 
        backgroundColor: background.color || '#FFE4E8',
        transform: `scale(${scale})`,
        ...spotlightStyle
      }}
    >
      {/* Pattern Overlay */}
      <div 
        className="absolute inset-0 z-10 opacity-100 pointer-events-none"
        style={getPatternCSS(background.pattern)}
      />

      {/* Screen layout */}
      <div className="absolute inset-0 z-20 flex flex-col justify-between p-14 pt-20">
        
        {/* Header */}
        <div className="flex items-center gap-6 border-b border-gray-400/20 pb-6">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/40 flex items-center justify-center bg-gradient-to-tr from-pink-500 to-indigo-500 text-white font-black text-3xl shadow-lg">
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              username.substring(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <h4 className="font-bold text-[34px] leading-tight" style={{ color: background.text || '#1A1A1A' }}>
              {username}
            </h4>
            <div className="flex items-center gap-2 text-[22px] opacity-70" style={{ color: background.text || '#1A1A1A' }}>
              <span>2hrs ago</span>
              <span>•</span>
              <span>👥</span>
              <span>•</span>
              <span className="italic">A Text Story</span>
            </div>
          </div>
        </div>

        {/* Story text body */}
        <div className="flex-1 flex flex-col justify-start pt-14 overflow-hidden">
          <div className="leading-relaxed select-none">
            {renderSegments()}
            
            {/* Read More cliffhanger */}
            <div className="text-right pt-8">
              <span 
                style={{ color: accentColor.hex || '#B22222' }}
                className="font-black text-2xl uppercase tracking-wider bg-white/30 border border-black/5 px-4 py-1.5 rounded-lg shadow-sm"
              >
                Read More.....
              </span>
            </div>
          </div>
        </div>

        {/* Maroon footer bar */}
        <div className="w-full bg-[#2D0000] border-t-2 border-black/10 py-5 rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-white text-[26px] font-black tracking-wide text-center uppercase">
            {footerText || 'Full Story In First Comment 👇'}
          </span>
        </div>

      </div>
    </AbsoluteFill>
  );
};
