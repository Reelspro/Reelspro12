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
  { name: 'deep_red', color: '#1A0505', pattern: 'embers', text: '#FFFFFF' }
];

const ACCENT_COLORS = [
  { name: 'Crimson', hex: '#E11D48' },
  { name: 'Teal', hex: '#0D9488' },
  { name: 'Gold', hex: '#D97706' },
  { name: 'Indigo', hex: '#4F46E5' },
  { name: 'Emerald', hex: '#059669' }
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

function splitIntoScreens(storyText, maxWordsPerScreen = 150) {
  if (!storyText) return [];
  const paragraphs = storyText.split(/\n+/).map(p => p.trim()).filter(Boolean);
  const screens = [];
  let currentScreenText = [];
  let currentWordCount = 0;

  for (const p of paragraphs) {
    const wordCount = p.split(/\s+/).length;
    if (currentWordCount + wordCount > maxWordsPerScreen && currentScreenText.length > 0) {
      screens.push(currentScreenText.join('\n\n'));
      currentScreenText = [p];
      currentWordCount = wordCount;
    } else {
      currentScreenText.push(p);
      currentWordCount += wordCount;
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
  // 1. Quoted speech: "..." or “...”
  // 2. ALL-CAPS words/phrases (3+ chars)
  // 3. Shock keywords
  
  // We construct a regex to match quotes or words
  // Let's do a simple tokenizer that scans words and builds segments.
  const regex = /("[^"]+"|[“][^”]+[”])|(\b[A-Z]{3,}\b)|(\b[a-zA-Z-]{3,}\b)/g;
  
  const tokens = [];
  let lastIndex = 0;
  let match;
  let accentCount = 0;
  const MAX_ACCENTS = 4; // 2-4 max highlights per screen

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
    const isQuote = match[1] !== undefined;
    const isAllCaps = match[2] !== undefined;
    const word = match[3] !== undefined ? match[3].toLowerCase() : '';

    if (isQuote) {
      tokens.push({
        text: fullMatch,
        style: 'dialogue' // Dialogue style (accent + italic)
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
