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
