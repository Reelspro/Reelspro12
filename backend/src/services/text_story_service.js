const BACKGROUNDS = [
  { name: 'pink_floral', color: '#FFF0F5', pattern: 'floral', text: '#2D0000' },
  { name: 'lavender_dots', color: '#F6F0FF', pattern: 'dots', text: '#1A0033' },
  { name: 'cream_leaves', color: '#FFFDD0', pattern: 'leaves', text: '#1E1E00' },
  { name: 'sky_stars', color: '#F0F8FF', pattern: 'stars', text: '#001A33' },
  { name: 'peach_hearts', color: '#FFEBE6', pattern: 'hearts', text: '#330D00' },
  { name: 'mint_waves', color: '#F0FFF8', pattern: 'waves', text: '#002613' },
  { name: 'yellow_sun', color: '#FFFFF0', pattern: 'sun', text: '#262600' },
  { name: 'gray_marble', color: '#F5F5F5', pattern: 'marble', text: '#1A1A1A' },
  { name: 'dark_navy', color: '#0A1128', pattern: 'navy', text: '#FFFFFF' },
  { name: 'deep_red', color: '#1A0505', pattern: 'embers', text: '#FFFFFF' },
  { name: 'ocean_breeze', color: '#E0F7FA', pattern: 'waves', text: '#004D40' },
  { name: 'sunset_glow', color: '#FFF3E0', pattern: 'sun', text: '#E65100' },
  { name: 'forest_mist', color: '#E8F5E9', pattern: 'leaves', text: '#1B5E20' },
  { name: 'rose_petal', color: '#FCE4EC', pattern: 'hearts', text: '#880E4F' },
  { name: 'royal_purple', color: '#F3E5F5', pattern: 'dots', text: '#4A148C' },
  { name: 'warm_sand', color: '#EFEBE9', pattern: 'waves', text: '#3E2723' },
  { name: 'sage_green', color: '#F1F8E9', pattern: 'leaves', text: '#33691E' },
  { name: 'cherry_blossom', color: '#FFF5F7', pattern: 'hearts', text: '#4A0E17' },
  { name: 'midnight_sky', color: '#0B0C10', pattern: 'stars', text: '#F5F5F5' },
  { name: 'gold_glimmer', color: '#FAF8F0', pattern: 'sun', text: '#4A3C00' },
  { name: 'mint_choco', color: '#E8F8F5', pattern: 'dots', text: '#117864' },
  { name: 'lavender_bliss', color: '#EADCF7', pattern: 'waves', text: '#4A148C' },
  { name: 'apricot_cream', color: '#FEF5E7', pattern: 'sun', text: '#784212' },
  { name: 'sky_cloud', color: '#EBF5FB', pattern: 'stars', text: '#1B4F72' },
  { name: 'charcoal_dark', color: '#1C2833', pattern: 'dots', text: '#F2F4F4' },
  { name: 'burgundy_wine', color: '#2C0812', pattern: 'hearts', text: '#FADBD8' },
  { name: 'olive_garden', color: '#F4F6F6', pattern: 'leaves', text: '#196F3D' },
  { name: 'soft_coral', color: '#FDF2E9', pattern: 'waves', text: '#6E2C00' },
  { name: 'plum_purple', color: '#2E0854', pattern: 'stars', text: '#F5EEF8' },
  { name: 'emerald_night', color: '#041F14', pattern: 'leaves', text: '#D4EFDF' },
  { name: 'ice_berg', color: '#F4F6F7', pattern: 'waves', text: '#2471A3' },
  { name: 'sweet_honey', color: '#FEF9E7', pattern: 'sun', text: '#7D6608' }
];


const ACCENT_COLORS = [
  { name: 'Crimson', hex: '#E11D48' },
  { name: 'Teal', hex: '#0D9488' },
  { name: 'Gold', hex: '#D97706' },
  { name: 'Indigo', hex: '#4F46E5' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Lime', hex: '#84CC16' },
  { name: 'Violet', hex: '#8B5CF6' },
  { name: 'Rose', hex: '#F43F5E' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Cyan', hex: '#06B6D4' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Fuchsia', hex: '#D946EF' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Sky', hex: '#0EA5E9' },
  { name: 'Purple', hex: '#A855F7' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Yellow', hex: '#EAB308' },
  { name: 'Mint', hex: '#10B981' },
  { name: 'Coral', hex: '#F87171' },
  { name: 'Lavender', hex: '#A78BFA' },
  { name: 'Peach', hex: '#FDBA74' },
  { name: 'Sea Green', hex: '#34D399' },
  { name: 'Hot Pink', hex: '#FF69B4' },
  { name: 'Deep Gold', hex: '#FFD700' },
  { name: 'Dark Orange', hex: '#FF4500' },
  { name: 'Neon Green', hex: '#39FF14' },
  { name: 'Royal Blue', hex: '#4169E1' },
  { name: 'Bright Orchid', hex: '#DA70D6' },
  { name: 'Crimson Rose', hex: '#DC143C' },
  { name: 'Turquoise', hex: '#40E0D0' },
  { name: 'Cyber Magenta', hex: '#FF007F' }
];

const ANIMATIONS = [
  { name: 'typewriter', description: 'Characters reveal one by one' },
  { name: 'fade_paragraphs', description: 'Paragraphs fade in sequentially' },
  { name: 'slide_up', description: 'Lines slide up on screen' },
  { name: 'zoom_punch', description: 'Accent words scale punchily' },
  { name: 'spotlight', description: 'Text glows in screen center' },
  { name: 'heartbeat', description: 'Subtle frame scale oscillation' }
];

const MUSIC_TRACKS = [
  { name: 'emotional_piano', bpm: 65, emotion: 'emotional' },
  { name: 'suspense_build', bpm: 90, emotion: 'suspense' },
  { name: 'romantic_soft', bpm: 72, emotion: 'emotional' },
  { name: 'betrayal_strings', bpm: 80, emotion: 'shocking' },
  { name: 'uplifting_beat', bpm: 120, emotion: 'motivational' },
  { name: 'horror_ambient', bpm: 55, emotion: 'horror' },
  { name: 'revenge_epic', bpm: 130, emotion: 'crime' },
  { name: 'lofi_chill', bpm: 85, emotion: 'funny' },
  { name: 'tense_clock', bpm: 100, emotion: 'mystery' },
  { name: 'wedding_piano', bpm: 70, emotion: 'emotional' }
];

const SFX_OPTIONS = [
  { name: 'typing_sfx', filename: 'typing_sfx.mp3' },
  { name: 'violin_sting', filename: 'violin_sting.mp3' },
  { name: 'page_whoosh', filename: 'page_whoosh.mp3' },
  { name: 'heartbeat_sfx', filename: 'heartbeat_sfx.mp3' },
  { name: 'crowd_gasp', filename: 'crowd_gasp.mp3' }
];

const SHOCK_KEYWORDS = [
  'shocked', 'betrayed', 'cheating', 'divorce', 'liar', 'pregnant', 'secret',
  'affair', 'mother-in-law', 'revenge', 'gasp', 'crying', 'tears', 'confessed',
  'caught', 'ruined', 'trapped', 'hiding', 'found out', 'sobbing', 'police',
  'business trip', 'girlfriend', 'boyfriend', 'married', 'husband', 'wife'
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomStyle() {
  const bg = pickRandom(BACKGROUNDS);
  const accent = pickRandom(ACCENT_COLORS);
  const animation = pickRandom(ANIMATIONS).name;
  const music = pickRandom(MUSIC_TRACKS);
  
  // Pick 1-2 random SFX
  const sfxCount = Math.floor(Math.random() * 2) + 1;
  const shuffledSfx = [...SFX_OPTIONS].sort(() => 0.5 - Math.random());
  const selectedSfx = shuffledSfx.slice(0, sfxCount).map(s => s.name);

  return {
    background: bg,
    accentColor: accent,
    animationStyle: animation,
    musicTrack: music,
    sfx: selectedSfx
  };
}

function splitParagraph(paragraph, maxWords) {
  const sentences = paragraph.match(/[^.!?]+[.!?]+(\s+|$)/g) || [paragraph];
  const subParagraphs = [];
  let currentSub = [];
  let currentWords = 0;
  for (const s of sentences) {
    const wCount = s.split(/\s+/).filter(Boolean).length;
    if (currentWords + wCount > maxWords && currentSub.length > 0) {
      subParagraphs.push(currentSub.join(' ').trim());
      currentSub = [s];
      currentWords = wCount;
    } else {
      currentSub.push(s);
      currentWords += wCount;
    }
  }
  if (currentSub.length > 0) {
    subParagraphs.push(currentSub.join(' ').trim());
  }
  return subParagraphs;
}

function decodeHtmlEntities(text) {
  if (!text) return text;
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&apos;/g, "'");
}

function splitIntoScreens(storyText, maxWordsPerScreen = 60) {
  if (!storyText) return [];
  // Decode HTML entities first so <highlight> tags work correctly
  const cleanText = decodeHtmlEntities(storyText);
  const paragraphs = cleanText.split(/\n+/).map(p => p.trim()).filter(Boolean);
  const screens = [];
  let currentScreenText = [];
  let currentWordCount = 0;

  for (const p of paragraphs) {
    const wordCount = p.split(/\s+/).length;
    if (wordCount > maxWordsPerScreen) {
      const subParts = splitParagraph(p, maxWordsPerScreen);
      for (const part of subParts) {
        const partWordCount = part.split(/\s+/).length;
        if (currentWordCount + partWordCount > maxWordsPerScreen && currentScreenText.length > 0) {
          screens.push(currentScreenText.join('\n\n'));
          currentScreenText = [part];
          currentWordCount = partWordCount;
        } else {
          currentScreenText.push(part);
          currentWordCount += partWordCount;
        }
      }
    } else {
      if (currentWordCount + wordCount > maxWordsPerScreen && currentScreenText.length > 0) {
        screens.push(currentScreenText.join('\n\n'));
        currentScreenText = [p];
        currentWordCount = wordCount;
      } else {
        currentScreenText.push(p);
        currentWordCount += wordCount;
      }
    }
  }

  if (currentScreenText.length > 0) {
    screens.push(currentScreenText.join('\n\n'));
  }

  return screens;
}

function parseSegments(screenText, accentColorHex) {
  if (!screenText) return [];

  // We want to segment the text. Let's find matches for:
  // 0. Explicit <highlight> tags
  // 1. Quoted speech: "..." or “...”
  // 2. ALL-CAPS words/phrases (3+ chars)
  // 3. Shock keywords
  
  // We construct a regex to match these patterns
  const regex = /(<highlight>[^<]+<\/highlight>)|("[^"]+"|[“][^”]+[”])|(\b[A-Z]{3,}\b)|(\b[a-zA-Z-]{3,}\b)/g;
  
  const tokens = [];
  let lastIndex = 0;
  let match;
  let accentCount = 0;
  const MAX_ACCENTS = 10; // Allow more highlights if explicitly tagged

  while ((match = regex.exec(screenText)) !== null) {
    const matchIndex = match.index;
    
    // Add text before the match
    if (matchIndex > lastIndex) {
      tokens.push({
        text: screenText.substring(lastIndex, matchIndex),
        style: 'normal'
      });
    }

    const fullMatch = match[0];
    const isHighlightTag = match[1] !== undefined;
    const isQuote = match[2] !== undefined;
    const isAllCaps = match[3] !== undefined;
    const word = match[4] !== undefined ? match[4].toLowerCase() : '';

    if (isHighlightTag) {
      // Strip the tags
      const cleanText = fullMatch.replace(/<\/?highlight>/g, '');
      tokens.push({
        text: cleanText,
        style: 'accent' // Apply accent highlight style
      });
    } else if (isQuote) {
      tokens.push({
        text: fullMatch,
        style: 'dialogue'
      });
    } else if (isAllCaps && accentCount < MAX_ACCENTS) {
      tokens.push({
        text: fullMatch,
        style: 'accent'
      });
      accentCount++;
    } else if (word && SHOCK_KEYWORDS.includes(word) && accentCount < MAX_ACCENTS) {
      tokens.push({
        text: fullMatch,
        style: 'accent'
      });
      accentCount++;
    } else {
      tokens.push({
        text: fullMatch,
        style: 'normal'
      });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < screenText.length) {
    tokens.push({
      text: screenText.substring(lastIndex),
      style: 'normal'
    });
  }

  // Combine contiguous tokens of the same style
  const combined = [];
  for (const token of tokens) {
    if (combined.length > 0 && combined[combined.length - 1].style === token.style) {
      combined[combined.length - 1].text += token.text;
    } else {
      combined.push({ text: token.text, style: token.style });
    }
  }

  return combined.filter(t => t.text.length > 0);
}

function generateTextStoryReel(storyText, username = 'Sarah Storyteller', avatarUrl = null) {
  const styles = pickRandomStyle();
  const screenTexts = splitIntoScreens(storyText);
  
  const screens = screenTexts.map((text, idx) => {
    const segments = parseSegments(text, styles.accentColor.hex);
    return {
      id: idx + 1,
      rawText: text,
      segments,
      isLast: idx === screenTexts.length - 1
    };
  });

  return {
    storyText,
    username,
    avatarUrl,
    ...styles,
    screens,
    footerText: 'Full Story In First Comment 👇'
  };
}

module.exports = {
  BACKGROUNDS,
  ACCENT_COLORS,
  ANIMATIONS,
  MUSIC_TRACKS,
  SFX_OPTIONS,
  pickRandomStyle,
  splitIntoScreens,
  parseSegments,
  generateTextStoryReel
};
