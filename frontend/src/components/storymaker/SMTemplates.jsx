import React, { useState, useEffect } from 'react';

const Btn = ({ children, style, ...p }) => (
  <button style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #2a2a3e', background: '#1a1a2e', color: '#ccc', fontSize: 12, cursor: 'pointer', ...style }} {...p}>
    {children}
  </button>
);

const DEFAULT_TEMPLATES = [
  {
    id: 1715800000000, name: '🔥 Reddit Drama',
    preset: 'bloodred',
    profile: { avatar: '', name: 'r/TrueOffMyChest', subtitle: 'Trending Stories', font: 'Montserrat', size: 20, color: '#f87171', showBg: false },
    text: { font: 'Inter', weight: 'Bold', align: 'Left', size: 28, lineH: 1.4, letterS: 0, color: '#fee2e2', highlight: '#dc2626' },
    bg: { type: 'Solid', color: '#450a0a', color2: '#1a1a2e', media: '', radius: 16, padding: 30, alpha: 90, showProfile: true },
    footer: { type: 'Fit to text', text: 'Wait for the twist...', color: '#fff', bgColor: '#7f1d1d', show: true }
  },
  {
    id: 1715800000001, name: '👻 Horror Suspense',
    preset: 'obsidian',
    profile: { avatar: '', name: 'Scary Tales', subtitle: '@midnight_terrors', font: 'Creepster', size: 24, color: '#94a3b8', showBg: false },
    text: { font: 'Lora', weight: 'Normal', align: 'Center', size: 26, lineH: 1.5, letterS: 1, color: '#cbd5e1', highlight: '#475569' },
    bg: { type: 'Gradient', color: '#000000', color2: '#1e293b', media: '', radius: 0, padding: 40, alpha: 60, showProfile: true },
    footer: { type: 'Fill', text: 'Follow for more scary stories', color: '#000', bgColor: '#475569', show: true }
  },
  {
    id: 1715800000002, name: '💼 Luxury Finance',
    preset: 'gold',
    profile: { avatar: '', name: 'Millionaire Mindset', subtitle: 'Daily Motivation', font: 'Playfair Display', size: 22, color: '#facc15', showBg: false },
    text: { font: 'Montserrat', weight: 'Bold', align: 'Center', size: 30, lineH: 1.3, letterS: -0.5, color: '#fefce8', highlight: '#eab308' },
    bg: { type: 'Solid', color: '#3f3f46', color2: '#1a1a2e', media: '', radius: 24, padding: 32, alpha: 95, showProfile: true },
    footer: { type: 'None', text: '', color: '#fff', bgColor: '#000', show: false }
  },
  {
    id: 1715800000003, name: '🎮 Cyberpunk Gaming',
    preset: 'cyberpunk',
    profile: { avatar: '', name: 'Glitch Mode', subtitle: 'Esports & Gaming', font: 'Anton', size: 26, color: '#22d3ee', showBg: false },
    text: { font: 'Roboto', weight: 'Normal', align: 'Left', size: 24, lineH: 1.4, letterS: 0, color: '#fdf4ff', highlight: '#d946ef' },
    bg: { type: 'Gradient', color: '#0f172a', color2: '#312e81', media: '', radius: 12, padding: 24, alpha: 80, showProfile: true },
    footer: { type: 'Fit to card', text: 'LIKE & SUBSCRIBE', color: '#fff', bgColor: '#d946ef', show: true }
  },
  {
    id: 1715800000004, name: '✨ Minimalist Aesthetic',
    preset: 'ice',
    profile: { avatar: '', name: 'Aesthetic Quotes', subtitle: 'Daily Peace', font: 'Caveat', size: 32, color: '#0f172a', showBg: false },
    text: { font: 'Nunito', weight: 'Normal', align: 'Center', size: 26, lineH: 1.6, letterS: 0.5, color: '#334155', highlight: '#bae6fd' },
    bg: { type: 'Solid', color: '#f8fafc', color2: '#e2e8f0', media: '', radius: 30, padding: 40, alpha: 100, showProfile: true },
    footer: { type: 'Fit to text', text: 'Share to save a life', color: '#fff', bgColor: '#0ea5e9', show: true }
  },
  {
    id: 1715800000005, name: '🌲 Deep Forest Nature',
    preset: 'forest',
    profile: { avatar: '', name: 'Nature Escapes', subtitle: '@wild_peace', font: 'Merriweather', size: 22, color: '#4ade80', showBg: false },
    text: { font: 'Lora', weight: 'Normal', align: 'Left', size: 25, lineH: 1.5, letterS: 0, color: '#f0fdf4', highlight: '#16a34a' },
    bg: { type: 'Gradient', color: '#052e16', color2: '#064e3b', media: '', radius: 20, padding: 28, alpha: 85, showProfile: true },
    footer: { type: 'Fit to card', text: 'Explore the Wild', color: '#fff', bgColor: '#16a34a', show: true }
  },
  {
    id: 1715800000006, name: '💎 Neon Synthwave',
    preset: 'neonpink',
    profile: { avatar: '', name: 'Retro Vibes', subtitle: '80s Nostalgia', font: 'Bangers', size: 28, color: '#f472b6', showBg: false },
    text: { font: 'Righteous', weight: 'Normal', align: 'Center', size: 27, lineH: 1.4, letterS: 1, color: '#fff', highlight: '#db2777' },
    bg: { type: 'Gradient', color: '#170f1a', color2: '#4a044e', media: '', radius: 10, padding: 35, alpha: 75, showProfile: true },
    footer: { type: 'Fill', text: 'RETRO FOREVER', color: '#fff', bgColor: '#db2777', show: true }
  },
  {
    id: 1715800000007, name: '🎞️ Vintage Sepia',
    preset: 'sepia',
    profile: { avatar: '', name: 'Old Archives', subtitle: 'Lost History', font: 'Playfair Display', size: 24, color: '#b45309', showBg: false },
    text: { font: 'PT Sans', weight: 'Normal', align: 'Justify', size: 22, lineH: 1.6, letterS: 0, color: '#451a03', highlight: '#d97706' },
    bg: { type: 'Solid', color: '#fef3c7', color2: '#fde68a', media: '', radius: 8, padding: 40, alpha: 95, showProfile: true },
    footer: { type: 'Fit to text', text: 'Vintage Memories', color: '#fef3c7', bgColor: '#b45309', show: true }
  },
  {
    id: 1715800000008, name: '🌌 The Abyss (Sci-Fi)',
    preset: 'abyss',
    profile: { avatar: '', name: 'Deep Space', subtitle: 'Cosmic Horror', font: 'Orbitron', size: 20, color: '#3b82f6', showBg: false },
    text: { font: 'Oswald', weight: 'Bold', align: 'Center', size: 32, lineH: 1.2, letterS: 2, color: '#cbd5e1', highlight: '#2563eb' },
    bg: { type: 'Solid', color: '#020617', color2: '#0f172a', media: '', radius: 0, padding: 50, alpha: 90, showProfile: true },
    footer: { type: 'None', text: '', color: '#fff', bgColor: '#000', show: false }
  },
  {
    id: 1715800000009, name: '👑 Royal Velvet',
    preset: 'royal',
    profile: { avatar: '', name: 'Majestic Tales', subtitle: 'Kings & Queens', font: 'Dancing Script', size: 36, color: '#c084fc', showBg: false },
    text: { font: 'Lora', weight: 'Italic', align: 'Center', size: 26, lineH: 1.5, letterS: 0.5, color: '#fbf7ff', highlight: '#9333ea' },
    bg: { type: 'Gradient', color: '#2e1065', color2: '#4c1d95', media: '', radius: 40, padding: 30, alpha: 100, showProfile: true },
    footer: { type: 'Fit to card', text: 'Subscribe for Royalty', color: '#fff', bgColor: '#7e22ce', show: true }
  },
  {
    id: 1715800000010, name: '🌸 Sakura Whispers',
    preset: 'sakura',
    profile: { avatar: '', name: 'Daily Romance', subtitle: '@sakura_tales', font: 'Dancing Script', size: 24, color: '#fda4af', showBg: false },
    text: { font: 'Lora', weight: 'Normal', align: 'Center', size: 26, lineH: 1.5, letterS: 0.5, color: '#fff1f2', highlight: '#f43f5e' },
    bg: { type: 'Gradient', color: '#4c0519', color2: '#1e000a', media: '', radius: 20, padding: 35, alpha: 90, showProfile: true },
    footer: { type: 'Fit to text', text: 'Like for Part 2', color: '#fff', bgColor: '#be123c', show: true }
  },
  {
    id: 1715800000011, name: '🍵 Matcha Vibe',
    preset: 'matcha',
    profile: { avatar: '', name: 'Calm Mind', subtitle: 'Peaceful Moments', font: 'Montserrat', size: 20, color: '#86efac', showBg: false },
    text: { font: 'Nunito', weight: 'Normal', align: 'Center', size: 25, lineH: 1.6, letterS: 0, color: '#f0fdf4', highlight: '#15803d' },
    bg: { type: 'Solid', color: '#062f17', color2: '#1a1a2e', media: '', radius: 24, padding: 30, alpha: 95, showProfile: true },
    footer: { type: 'Fit to text', text: 'Breathe in, breathe out', color: '#fff', bgColor: '#16a34a', show: true }
  },
  {
    id: 1715800000012, name: '🍊 Citrus Punch',
    preset: 'citrus',
    profile: { avatar: '', name: 'Energy Up', subtitle: 'Daily Motivation', font: 'Anton', size: 24, color: '#fdba74', showBg: false },
    text: { font: 'Roboto', weight: 'Bold', align: 'Left', size: 28, lineH: 1.3, letterS: 1, color: '#fff7ed', highlight: '#ea580c' },
    bg: { type: 'Gradient', color: '#431407', color2: '#7c2d12', media: '', radius: 12, padding: 25, alpha: 85, showProfile: true },
    footer: { type: 'Fill', text: 'STAY MOTIVATED', color: '#fff', bgColor: '#ea580c', show: true }
  },
  {
    id: 1715800000013, name: '💎 Ice Castle',
    preset: 'icecastle',
    profile: { avatar: '', name: 'Chill Stories', subtitle: 'Cool Facts', font: 'Orbitron', size: 22, color: '#67e8f9', showBg: false },
    text: { font: 'Inter', weight: 'Normal', align: 'Center', size: 24, lineH: 1.5, letterS: 0, color: '#ecfeff', highlight: '#0891b2' },
    bg: { type: 'Gradient', color: '#083344', color2: '#164e63', media: '', radius: 16, padding: 32, alpha: 90, showProfile: true },
    footer: { type: 'None', text: '', color: '#fff', bgColor: '#000', show: false }
  },
  {
    id: 1715800000014, name: '🍫 Midnight Choco',
    preset: 'choco',
    profile: { avatar: '', name: 'Late Night Thoughts', subtitle: 'Deep Conversations', font: 'Playfair Display', size: 22, color: '#d97706', showBg: false },
    text: { font: 'Lora', weight: 'Normal', align: 'Justify', size: 24, lineH: 1.6, letterS: 0.5, color: '#fef3c7', highlight: '#b45309' },
    bg: { type: 'Solid', color: '#271b13', color2: '#1a1a2e', media: '', radius: 8, padding: 35, alpha: 98, showProfile: true },
    footer: { type: 'Fit to card', text: 'Share your thoughts below', color: '#fff', bgColor: '#92400e', show: true }
  },
  {
    id: 1715800000015, name: '🌌 Sunset Mirage',
    preset: 'mirage',
    profile: { avatar: '', name: 'Dreamy Vibe', subtitle: '@mirage_creations', font: 'Caveat', size: 30, color: '#f472b6', showBg: false },
    text: { font: 'Montserrat', weight: 'Bold', align: 'Center', size: 28, lineH: 1.4, letterS: -0.5, color: '#fff1f2', highlight: '#db2777' },
    bg: { type: 'Gradient', color: '#311042', color2: '#701a75', media: '', radius: 28, padding: 38, alpha: 80, showProfile: true },
    footer: { type: 'Fit to text', text: 'Lost in the dream', color: '#fff', bgColor: '#a21caf', show: true }
  },
  {
    id: 1715800000016, name: '🎭 Phantom Opera',
    preset: 'phantom',
    profile: { avatar: '', name: 'Classic Tales', subtitle: 'Gothic Romance', font: 'Cinzel', size: 24, color: '#fca5a5', showBg: false },
    text: { font: 'EB Garamond', weight: 'Italic', align: 'Center', size: 27, lineH: 1.5, letterS: 1, color: '#fef2f2', highlight: '#991b1b' },
    bg: { type: 'Gradient', color: '#180404', color2: '#450a0a', media: '', radius: 0, padding: 40, alpha: 95, showProfile: true },
    footer: { type: 'Fill', text: 'THE OPERA CONTINUES', color: '#fff', bgColor: '#7f1d1d', show: true }
  },
  {
    id: 1715800000017, name: '🌾 Sage Wisdom',
    preset: 'sage',
    profile: { avatar: '', name: 'Mindful Daily', subtitle: 'Ancient Wisdom', font: 'Merriweather', size: 20, color: '#a3e635', showBg: false },
    text: { font: 'Lora', weight: 'Normal', align: 'Left', size: 25, lineH: 1.5, letterS: 0, color: '#f7fee7', highlight: '#4d7c0f' },
    bg: { type: 'Solid', color: '#14532d', color2: '#1a1a2e', media: '', radius: 18, padding: 30, alpha: 92, showProfile: true },
    footer: { type: 'Fit to text', text: 'Apply this to your life', color: '#fff', bgColor: '#3f6212', show: true }
  },
  {
    id: 1715800000018, name: '💫 Cosmic Neon',
    preset: 'cosmicneon',
    profile: { avatar: '', name: 'Galaxy Guide', subtitle: '@neon_space', font: 'Orbitron', size: 22, color: '#38bdf8', showBg: false },
    text: { font: 'Righteous', weight: 'Normal', align: 'Center', size: 29, lineH: 1.4, letterS: 1, color: '#f0f9ff', highlight: '#0284c7' },
    bg: { type: 'Gradient', color: '#090d16', color2: '#1e1b4b', media: '', radius: 10, padding: 24, alpha: 75, showProfile: true },
    footer: { type: 'Fit to card', text: '🚀 NEXT LEVEL 🚀', color: '#fff', bgColor: '#0369a1', show: true }
  },
  {
    id: 1715800000019, name: '🍂 Autumn Leaves',
    preset: 'autumn',
    profile: { avatar: '', name: 'Seasonal Nostalgia', subtitle: 'Autumn Vibes', font: 'Dancing Script', size: 26, color: '#fdba74', showBg: false },
    text: { font: 'Lora', weight: 'Normal', align: 'Center', size: 25, lineH: 1.5, letterS: 0, color: '#fff7ed', highlight: '#c2410c' },
    bg: { type: 'Gradient', color: '#3c1004', color2: '#7c2d12', media: '', radius: 15, padding: 30, alpha: 95, showProfile: true },
    footer: { type: 'Fit to text', text: 'Cozy up and listen', color: '#fff', bgColor: '#9a3412', show: true }
  },
  {
    id: 1715800000020, name: '🌊 Deep Ocean',
    preset: 'deepocean',
    profile: { avatar: '', name: 'Ocean Secrets', subtitle: 'Deep Sea Exploration', font: 'Montserrat', size: 22, color: '#38bdf8', showBg: false },
    text: { font: 'Oswald', weight: 'Normal', align: 'Center', size: 28, lineH: 1.3, letterS: 0.5, color: '#f0f9ff', highlight: '#0284c7' },
    bg: { type: 'Gradient', color: '#041d24', color2: '#083344', media: '', radius: 20, padding: 28, alpha: 90, showProfile: true },
    footer: { type: 'None', text: '', color: '#fff', bgColor: '#000', show: false }
  },
  {
    id: 1715800000021, name: '🎨 Pastel Dreams',
    preset: 'pasteldreams',
    profile: { avatar: '', name: 'Artistic Vibe', subtitle: 'Soft Aesthetics', font: 'Caveat', size: 32, color: '#475569', showBg: false },
    text: { font: 'Nunito', weight: 'Normal', align: 'Center', size: 26, lineH: 1.5, letterS: 0, color: '#1e293b', highlight: '#cbd5e1' },
    bg: { type: 'Solid', color: '#f1f5f9', color2: '#e2e8f0', media: '', radius: 32, padding: 40, alpha: 100, showProfile: true },
    footer: { type: 'Fit to text', text: 'Create beauty daily', color: '#fff', bgColor: '#64748b', show: true }
  },
  {
    id: 1715800000022, name: '⚡ Lightning Storm',
    preset: 'lightning',
    profile: { avatar: '', name: 'Storm Chaser', subtitle: 'Thrill Seekers', font: 'Anton', size: 24, color: '#c084fc', showBg: false },
    text: { font: 'Roboto', weight: 'Bold', align: 'Left', size: 28, lineH: 1.3, letterS: 0, color: '#faf5ff', highlight: '#7e22ce' },
    bg: { type: 'Gradient', color: '#180828', color2: '#3b0764', media: '', radius: 8, padding: 26, alpha: 80, showProfile: true },
    footer: { type: 'Fill', text: 'FEEL THE FORCE', color: '#fff', bgColor: '#7e22ce', show: true }
  },
  {
    id: 1715800000023, name: '🏜️ Sahara Sun',
    preset: 'sahara',
    profile: { avatar: '', name: 'Desert Nomads', subtitle: 'Wandering Souls', font: 'Playfair Display', size: 22, color: '#fbbf24', showBg: false },
    text: { font: 'Lora', weight: 'Normal', align: 'Center', size: 25, lineH: 1.5, letterS: 1, color: '#fffbeb', highlight: '#d97706' },
    bg: { type: 'Solid', color: '#451a03', color2: '#1a1a2e', media: '', radius: 16, padding: 35, alpha: 92, showProfile: true },
    footer: { type: 'Fit to text', text: 'Find your path', color: '#fff', bgColor: '#b45309', show: true }
  },
  {
    id: 1715800000024, name: '🖤 Noir Detective',
    preset: 'noir',
    profile: { avatar: '', name: 'Crime Alley', subtitle: 'Cold Cases', font: 'Courier New', size: 22, color: '#94a3b8', showBg: false },
    text: { font: 'PT Sans', weight: 'Normal', align: 'Left', size: 23, lineH: 1.6, letterS: 0.5, color: '#f1f5f9', highlight: '#334155' },
    bg: { type: 'Gradient', color: '#090d16', color2: '#1e293b', media: '', radius: 0, padding: 45, alpha: 95, showProfile: true },
    footer: { type: 'Fit to text', text: 'The case remains open...', color: '#fff', bgColor: '#475569', show: true }
  },
  {
    id: 1715800000025, name: '🌿 Emerald Oasis',
    preset: 'emeraldoasis',
    profile: { avatar: '', name: 'Eco Living', subtitle: 'Green Future', font: 'Merriweather', size: 20, color: '#a7f3d0', showBg: false },
    text: { font: 'Lora', weight: 'Normal', align: 'Center', size: 25, lineH: 1.5, letterS: 0, color: '#ecfdf5', highlight: '#047857' },
    bg: { type: 'Gradient', color: '#022c22', color2: '#064e3b', media: '', radius: 24, padding: 30, alpha: 88, showProfile: true },
    footer: { type: 'Fit to card', text: 'Grow green together', color: '#fff', bgColor: '#059669', show: true }
  },
  {
    id: 1715800000026, name: '🔮 Mystic Velvet',
    preset: 'mystic',
    profile: { avatar: '', name: 'Fortunes Told', subtitle: 'Psychic Readings', font: 'Dancing Script', size: 34, color: '#e9d5ff', showBg: false },
    text: { font: 'Lora', weight: 'Italic', align: 'Center', size: 26, lineH: 1.5, letterS: 0.5, color: '#faf5ff', highlight: '#7e22ce' },
    bg: { type: 'Gradient', color: '#2e1065', color2: '#581c87', media: '', radius: 30, padding: 32, alpha: 100, showProfile: true },
    footer: { type: 'Fit to text', text: 'Unlock your destiny', color: '#fff', bgColor: '#7e22ce', show: true }
  },
  {
    id: 1715800000027, name: '☕ Espresso Shot',
    preset: 'espresso',
    profile: { avatar: '', name: 'Daily Brew', subtitle: 'Coffee & Code', font: 'Montserrat', size: 20, color: '#f59e0b', showBg: false },
    text: { font: 'Inter', weight: 'Bold', align: 'Left', size: 27, lineH: 1.4, letterS: 0, color: '#fef3c7', highlight: '#b45309' },
    bg: { type: 'Solid', color: '#1c1917', color2: '#1a1a2e', media: '', radius: 12, padding: 28, alpha: 96, showProfile: true },
    footer: { type: 'Fill', text: 'KEEP CODING ☕', color: '#fff', bgColor: '#78350f', show: true }
  },
  {
    id: 1715800000028, name: '🎈 Candy Dream',
    preset: 'candydream',
    profile: { avatar: '', name: 'Sweet Tooth', subtitle: 'Fun & Games', font: 'Bangers', size: 28, color: '#f472b6', showBg: false },
    text: { font: 'Righteous', weight: 'Normal', align: 'Center', size: 27, lineH: 1.4, letterS: 1, color: '#fff', highlight: '#db2777' },
    bg: { type: 'Gradient', color: '#581c87', color2: '#9d174d', media: '', radius: 20, padding: 30, alpha: 80, showProfile: true },
    footer: { type: 'Fit to card', text: 'Taste the sweetness', color: '#fff', bgColor: '#be123c', show: true }
  },
  {
    id: 1715800000029, name: '🧊 Polar Glare',
    preset: 'polar',
    profile: { avatar: '', name: 'Arctic Tales', subtitle: 'Cold Truths', font: 'Orbitron', size: 20, color: '#38bdf8', showBg: false },
    text: { font: 'Oswald', weight: 'Bold', align: 'Center', size: 30, lineH: 1.3, letterS: 1.5, color: '#f0f9ff', highlight: '#0284c7' },
    bg: { type: 'Solid', color: '#0f172a', color2: '#1a1a2e', media: '', radius: 10, padding: 34, alpha: 94, showProfile: true },
    footer: { type: 'None', text: '', color: '#fff', bgColor: '#000', show: false }
  },
  {
    id: 1715800000030, name: '🌋 Lava Flow',
    preset: 'lava',
    profile: { avatar: '', name: 'Volcano Watch', subtitle: 'Hot Topics', font: 'Anton', size: 24, color: '#f87171', showBg: false },
    text: { font: 'Roboto', weight: 'Bold', align: 'Center', size: 28, lineH: 1.3, letterS: 0.5, color: '#fee2e2', highlight: '#dc2626' },
    bg: { type: 'Gradient', color: '#450a0a', color2: '#7f1d1d', media: '', radius: 16, padding: 32, alpha: 85, showProfile: true },
    footer: { type: 'Fit to text', text: 'Explosive information', color: '#fff', bgColor: '#b91c1c', show: true }
  },
  {
    id: 1715800000031, name: '🌾 Golden Fields',
    preset: 'goldenfields',
    profile: { avatar: '', name: 'Rustic Life', subtitle: 'Simple Pleasures', font: 'Playfair Display', size: 22, color: '#fbbf24', showBg: false },
    text: { font: 'Lora', weight: 'Normal', align: 'Justify', size: 24, lineH: 1.5, letterS: 0, color: '#fffbeb', highlight: '#d97706' },
    bg: { type: 'Solid', color: '#451a03', color2: '#1a1a2e', media: '', radius: 14, padding: 36, alpha: 92, showProfile: true },
    footer: { type: 'Fit to text', text: 'Harvest the joy', color: '#fff', bgColor: '#b45309', show: true }
  }
];

export default function SMTemplates({ setTab }) {
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('sm_templates');
    let loaded = [];
    if (saved) {
      try { loaded = JSON.parse(saved); } catch(e) {}
    }
    setTemplates([...loaded, ...DEFAULT_TEMPLATES]);
  }, []);

  const loadTemplate = (tmpl) => {
    localStorage.setItem('sm_current_draft', JSON.stringify(tmpl));
    setTab('story');
  };

  const deleteTemplate = (id) => {
    const newT = templates.filter(t => t.id !== id);
    setTemplates(newT);
    localStorage.setItem('sm_templates', JSON.stringify(newT));
  };

  return (
    <div style={{ padding: 28, height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Templates</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn onClick={() => setTab('story')}>⚡ Create New Poster</Btn>
          <Btn onClick={() => setTemplates([...templates])}>⟳ Refresh</Btn>
        </div>
      </div>
      
      {templates.length === 0 ? (
        <div style={{
          background: 'linear-gradient(135deg,#1a1a2e,#0d0d18)', border: '1px solid #2a2a4e',
          borderRadius: 20, padding: '60px 40px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div style={{ fontSize: 16, color: '#666', lineHeight: 1.6 }}>
            You haven't saved any templates yet.<br />
            Design one in Story Maker and click <strong style={{ color: '#a78bfa' }}>Save Template</strong>.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {templates.map(t => (
            <div key={t.id} style={{
              background: '#0d0d18', border: '1px solid #2a2a3e', borderRadius: 16, padding: 20,
              display: 'flex', flexDirection: 'column', gap: 12
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 600, fontSize: 16, color: '#fff' }}>{t.name || 'Untitled Template'}</div>
                <div style={{ fontSize: 11, color: '#666' }}>{new Date(t.id).toLocaleDateString()}</div>
              </div>
              
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                <span style={{ fontSize: 10, padding: '4px 8px', background: '#1a1a2e', borderRadius: 6, color: '#a78bfa' }}>Theme: {t.profile?.theme || 'Default'}</span>
                <span style={{ fontSize: 10, padding: '4px 8px', background: '#1a1a2e', borderRadius: 6, color: '#38bdf8' }}>Font: {t.text?.font || 'Inter'}</span>
              </div>
              
              <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                <button onClick={() => loadTemplate(t)} style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Use Template</button>
                <button onClick={() => deleteTemplate(t.id)} style={{ padding: '8px', borderRadius: 8, border: '1px solid #2a2a3e', background: 'transparent', color: '#ef4444', fontSize: 12, cursor: 'pointer' }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
