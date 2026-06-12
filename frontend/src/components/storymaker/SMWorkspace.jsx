import React, { useState } from 'react';
import toast from 'react-hot-toast';
import ColorPicker from './ColorPicker';
import ExportWizard from './ExportWizard';

const DEFAULT_STORY = "I recently got married. My husband has an adult son. <highlight>I do not have children.</highlight> When we were talking about combining our households, I realized something important. The financial aspect of taking care of a family was going to be completely different than I originally thought.";

const TABS = [
  { id: 'profile', icon: '👤', label: 'Profile & Title' },
  { id: 'text', icon: '🅰️', label: 'Typography' },
  { id: 'bg', icon: '🖼️', label: 'Background' },
  { id: 'footer', icon: '🔀', label: 'Footer' },
];

const PRESETS = {
  purple: { label: 'Purple (Default)', nameColor: '#a78bfa', textColor: '#ffffff', highlight: '#7c3aed', bg: '#0d0d18' },
  sunset: { label: 'Sunset', nameColor: '#fb923c', textColor: '#ffffff', highlight: '#f97316', bg: '#451a03' },
  ocean: { label: 'Ocean Blue', nameColor: '#38bdf8', textColor: '#ffffff', highlight: '#0284c7', bg: '#082f49' },
  midnight: { label: 'Midnight', nameColor: '#9ca3af', textColor: '#f3f4f6', highlight: '#374151', bg: '#111827' },
  cyberpunk: { label: 'Cyberpunk', nameColor: '#22d3ee', textColor: '#fdf4ff', highlight: '#d946ef', bg: '#0f172a' },
  bloodred: { label: 'Blood Red', nameColor: '#f87171', textColor: '#fee2e2', highlight: '#dc2626', bg: '#450a0a' },
  forest: { label: 'Deep Forest', nameColor: '#4ade80', textColor: '#f0fdf4', highlight: '#16a34a', bg: '#052e16' },
  gold: { label: 'Luxury Gold', nameColor: '#facc15', textColor: '#fefce8', highlight: '#eab308', bg: '#3f3f46' },
  neonpink: { label: 'Neon Pink', nameColor: '#f472b6', textColor: '#fff', highlight: '#db2777', bg: '#170f1a' },
  matrix: { label: 'The Matrix', nameColor: '#4ade80', textColor: '#dcfce7', highlight: '#22c55e', bg: '#020617' },
  ice: { label: 'Ice White', nameColor: '#7dd3fc', textColor: '#0f172a', highlight: '#bae6fd', bg: '#f8fafc' },
  royal: { label: 'Royal Velvet', nameColor: '#c084fc', textColor: '#fbf7ff', highlight: '#9333ea', bg: '#2e1065' },
  sepia: { label: 'Vintage Sepia', nameColor: '#b45309', textColor: '#451a03', highlight: '#d97706', bg: '#fef3c7' },
  abyss: { label: 'The Abyss', nameColor: '#3b82f6', textColor: '#cbd5e1', highlight: '#2563eb', bg: '#020617' },
  neoncyan: { label: 'Neon Cyan', nameColor: '#22d3ee', textColor: '#ecfeff', highlight: '#06b6d4', bg: '#083344' },
  obsidian: { label: 'Obsidian', nameColor: '#94a3b8', textColor: '#cbd5e1', highlight: '#475569', bg: '#000000' },
  emerald: { label: 'Emerald City', nameColor: '#34d399', textColor: '#ecfdf5', highlight: '#10b981', bg: '#064e3b' },
  ruby: { label: 'Ruby Crimson', nameColor: '#fb7185', textColor: '#fff1f2', highlight: '#e11d48', bg: '#4c0519' },
  amethyst: { label: 'Amethyst', nameColor: '#d8b4fe', textColor: '#faf5ff', highlight: '#a855f7', bg: '#3b0764' },
  slate: { label: 'Slate Grey', nameColor: '#cbd5e1', textColor: '#f1f5f9', highlight: '#64748b', bg: '#0f172a' }
};

const FONTS = [
  'Inter', 'Roboto', 'Poppins', 'Lora', 'Merriweather', 'Montserrat', 'Open Sans', 'Lato', 'Oswald', 'Raleway',
  'Playfair Display', 'Noto Sans', 'Noto Serif', 'Ubuntu', 'Nunito', 'Mukta', 'PT Sans', 'Rubik', 'Work Sans',
  'Fira Sans', 'Quicksand', 'Barlow', 'Mulish', 'Inconsolata', 'Anton', 'Josefin Sans', 'Dancing Script', 
  'Pacifico', 'Caveat', 'Righteous', 'Creepster', 'Bangers', 'Times New Roman', 'Arial', 'Courier New'
];

export default function SMWorkspace({ setTab }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [colorPicker, setColorPicker] = useState(null); // { target: 'nameColor', val: '#fff' }
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState(null);
  
  // --- State ---
  const [preset, setPreset] = useState('purple');
  const [profile, setProfile] = useState({
    avatar: '', name: 'Reddit Stories', subtitle: '@reddit_tales',
    font: 'Inter', size: 18, color: '#a78bfa', showBg: false
  });
  const [text, setText] = useState({
    font: 'Inter', weight: 'Normal', align: 'Left',
    size: 24, lineH: 1.4, letterS: 0, color: '#ffffff', highlight: '#7c3aed',
    content: DEFAULT_STORY
  });
  const [bg, setBg] = useState({
    type: 'Solid', color: '#0d0d18', color2: '#1a1a2e', media: '', mediaType: '',
    radius: 20, padding: 24, alpha: 100, showProfile: true
  });
  const [footer, setFooter] = useState({
    type: 'Fit to text', text: 'Continue Reading in Comments..',
    color: '#ffffff', bgColor: '#1e1e2e', show: true
  });

  const handleFetchRandomArticle = async () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const token = localStorage.getItem('token');
    const loadToast = toast.loading('Fetching random story from website...');
    try {
      const res = await fetch(`${API_URL}/reels/random-website-article`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success && data.article) {
        setText(t => ({ ...t, content: data.article.content || data.article.title }));
        setSelectedArticleId(data.article.id);
        
        if (profile.name === 'Reddit Stories') {
          const categoryName = data.article.source_category || 'Website Story';
          setProfile(p => ({
            ...p,
            name: categoryName.charAt(0).toUpperCase() + categoryName.slice(1)
          }));
        }

        toast.success('Random story loaded!', { id: loadToast });
      } else {
        toast.error(data.error || 'Failed to fetch article', { id: loadToast });
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error fetching article', { id: loadToast });
    }
  };

  // Load draft on mount if available
  React.useEffect(() => {
    const draft = localStorage.getItem('sm_current_draft');
    if (draft) {
      try {
        const d = JSON.parse(draft);
        if (d.profile) setProfile(p => ({ ...p, ...d.profile }));
        if (d.text) setText(t => ({ ...t, ...d.text, content: d.text.content || t.content }));
        if (d.bg) setBg(b => ({ ...b, ...d.bg }));
        if (d.footer) setFooter(f => ({ ...f, ...d.footer }));
        if (d.preset) setPreset(d.preset);
        localStorage.removeItem('sm_current_draft');
      } catch (e) {
        console.error("Draft load error:", e);
      }
    }
  }, []);

  // Dynamically load selected fonts from Google Fonts
  React.useEffect(() => {
    const loadFont = (fontName) => {
      if (!fontName) return;
      const id = `font-${fontName.replace(/\s+/g, '-')}`;
      if (document.getElementById(id)) return;
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@400;700&display=swap`;
      document.head.appendChild(link);
    };
    loadFont(profile.font);
    loadFont(text.font);
  }, [profile.font, text.font]);

  const handleReset = () => {
    setPreset('purple');
    applyPreset('purple');
    setText(s => ({ ...s, content: DEFAULT_STORY }));
    setSelectedArticleId(null);
    setProfile({
      avatar: '', name: 'Reddit Stories', subtitle: '@reddit_tales',
      font: 'Inter', size: 18, color: '#a78bfa', showBg: false
    });
    setBg({
      type: 'Solid', color: '#0d0d18', color2: '#1a1a2e', media: '',
      radius: 20, padding: 24, alpha: 100, showProfile: true
    });
    setFooter({
      type: 'Fit to text', text: 'Continue Reading in Comments..',
      color: '#ffffff', bgColor: '#1e1e2e', show: true
    });
    toast.success('Reset to defaults');
  };

  const handleSaveTemplate = () => {
    const name = prompt("Enter a name for this template:");
    if (!name) return;
    const newTmpl = { id: Date.now(), name, preset, profile, text, bg, footer };
    const existing = JSON.parse(localStorage.getItem('sm_templates') || '[]');
    localStorage.setItem('sm_templates', JSON.stringify([newTmpl, ...existing]));
    toast.success('Template Saved successfully!');
  };

  const handleNewPoster = () => {
    handleReset();
    toast.success('Created new poster');
  };

  // --- Helpers ---
  const applyPreset = (k) => {
    const p = PRESETS[k];
    if(!p) return;
    setPreset(k);
    setProfile(s => ({ ...s, color: p.nameColor }));
    setText(s => ({ ...s, color: p.textColor, highlight: p.highlight }));
    setBg(s => ({ ...s, color: p.bg }));
  };

  const openPicker = (target, currentVal) => setColorPicker({ target, val: currentVal });
  const handleColorChange = (hex) => {
    const t = colorPicker.target;
    if (t === 'profileColor') setProfile({ ...profile, color: hex });
    else if (t === 'textColor') setText({ ...text, color: hex });
    else if (t === 'highlight') setText({ ...text, highlight: hex });
    else if (t === 'bgColor') setBg({ ...bg, color: hex });
    else if (t === 'bgCard') setBg({ ...bg, color2: hex });
    else if (t === 'footerColor') setFooter({ ...footer, color: hex });
    else if (t === 'footerBg') setFooter({ ...footer, bgColor: hex });
  };

  const handleFileUpload = (e, target) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (target === 'avatar') {
      setProfile({ ...profile, avatar: url });
    } else if (target === 'media') {
      setBg({ ...bg, media: url, mediaType: file.type.startsWith('video/') ? 'video' : 'image' });
    }
  };

  const Btn = ({ children, onClick, active, style }) => (
    <button onClick={onClick} style={{
      padding: '8px 14px', borderRadius: 8, border: active ? '1px solid #7c3aed' : '1px solid #2a2a3e',
      background: active ? '#1a0a2e' : '#1a1a2e', color: active ? '#a78bfa' : '#aaa', fontSize: 12, cursor: 'pointer', ...style
    }}>
      {children}
    </button>
  );

  const InputRow = ({ label, children }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
      <div style={{ width: 90, fontSize: 12, color: '#888' }}>{label}</div>
      <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center' }}>{children}</div>
    </div>
  );

  const Slider = ({ val, min, max, step, onChange, unit = '' }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
      <input type="range" min={min} max={max} step={step} value={val} onChange={e => onChange(+e.target.value)} style={{ flex: 1, accentColor: '#7c3aed' }} />
      <span style={{ fontSize: 12, color: '#a78bfa', width: 36, textAlign: 'right' }}>{val}{unit}</span>
    </div>
  );

  const ColorBtn = ({ color, onClick }) => (
    <button onClick={onClick} style={{
      width: 32, height: 32, borderRadius: 8, background: color, border: '1px solid #3a3a4e', cursor: 'pointer'
    }} />
  );

  // --- Right Canvas Parsing ---
  const parseContent = (content) => {
    const parts = content.split(/(<highlight>.*?<\/highlight>)/g);
    return parts.map((part, i) => {
      if (part.startsWith('<highlight>') && part.endsWith('</highlight>')) {
        const inner = part.replace(/<\/?highlight>/g, '');
        return <span key={i} style={{ backgroundColor: text.highlight, padding: '2px 6px', borderRadius: 4 }}>{inner}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* LEFT: Configurator Suite */}
      <div style={{ width: 380, background: '#12121a', borderRight: '1px solid #1e1e2e', display: 'flex', flexDirection: 'column' }}>
        {/* Tab Nav */}
        <div style={{ display: 'flex', padding: '16px', gap: 8, borderBottom: '1px solid #1e1e2e' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: activeTab === t.id ? '#1a1a2e' : 'transparent',
              color: activeTab === t.id ? '#a78bfa' : '#666',
              borderBottom: activeTab === t.id ? '2px solid #7c3aed' : '2px solid transparent',
            }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{t.icon}</div>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
          
          {activeTab === 'profile' && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Template Preset</div>
                <select value={preset} onChange={e => applyPreset(e.target.value)} style={{ width: '100%', padding: 10, background: '#0d0d18', border: '1px solid #2a2a3e', borderRadius: 8, color: '#eee' }}>
                  {Object.entries(PRESETS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div style={{ background: '#0d0d18', padding: 16, borderRadius: 12, border: '1px solid #1e1e2e', marginBottom: 20 }}>
                <InputRow label="Avatar">
                  <label style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #2a2a3e', background: '#1a1a2e', color: '#aaa', fontSize: 12, cursor: 'pointer' }}>
                    CHOOSE FILE
                    <input type="file" accept="image/*" hidden onChange={(e) => handleFileUpload(e, 'avatar')} />
                  </label>
                  <span style={{ fontSize: 11, color: '#555' }}>{profile.avatar ? 'Image selected' : 'No file chosen'}</span>
                </InputRow>
                <InputRow label="Poster Name">
                  <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} style={{ flex: 1, background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 6, color: '#fff', padding: '6px 10px' }} />
                  <Btn>⚡</Btn>
                </InputRow>
                <InputRow label="Subtitle">
                  <input value={profile.subtitle} onChange={e => setProfile({...profile, subtitle: e.target.value})} style={{ flex: 1, background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 6, color: '#fff', padding: '6px 10px' }} />
                </InputRow>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Name Style</div>
              <InputRow label="Font Family">
                <select value={profile.font} onChange={e => setProfile({...profile, font: e.target.value})} style={{ flex: 1, padding: 8, background: '#0d0d18', border: '1px solid #2a2a3e', borderRadius: 8, color: '#eee' }}>
                  {FONTS.map(f => <option key={f}>{f}</option>)}
                </select>
              </InputRow>
              <InputRow label="Name Size"><Slider val={profile.size} min={12} max={40} step={1} unit="px" onChange={v => setProfile({...profile, size: v})} /></InputRow>
              <InputRow label="Name Color"><ColorBtn color={profile.color} onClick={() => openPicker('profileColor', profile.color)} /></InputRow>
              <InputRow label="Name BG">
                <input type="checkbox" checked={profile.showBg} onChange={e => setProfile({...profile, showBg: e.target.checked})} />
              </InputRow>
            </div>
          )}

          {activeTab === 'text' && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e8f0' }}>Story Content</div>
                  <button 
                    onClick={handleFetchRandomArticle}
                    style={{
                      padding: '4px 10px', borderRadius: 6, border: '1px solid #7c3aed',
                      background: '#2a1050', color: '#a78bfa', fontSize: 11, cursor: 'pointer', fontWeight: 600,
                      transition: 'all 0.15s'
                    }}
                  >
                    ⚡ Auto Fetch Story
                  </button>
                </div>
                <textarea
                  value={text.content}
                  onChange={e => setText({...text, content: e.target.value})}
                  rows={6}
                  style={{ width: '100%', background: '#0d0d18', border: '1px solid #2a2a3e', borderRadius: 8, color: '#fff', padding: '10px', fontSize: 13, resize: 'vertical' }}
                />
                <div style={{ fontSize: 11, color: '#666', marginTop: 6 }}>Use &lt;highlight&gt;text&lt;/highlight&gt; to emphasize specific words.</div>
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                <div style={{ flex: 1, background: '#0d0d18', padding: 12, borderRadius: 10, border: '1px solid #1e1e2e' }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>Highlight Color</div>
                  <ColorBtn color={text.highlight} onClick={() => openPicker('highlight', text.highlight)} />
                </div>
                <div style={{ flex: 1, background: '#0d0d18', padding: 12, borderRadius: 10, border: '1px solid #1e1e2e' }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>Text Color</div>
                  <ColorBtn color={text.color} onClick={() => openPicker('textColor', text.color)} />
                </div>
              </div>
              <InputRow label="Font Family">
                <select value={text.font} onChange={e => setText({...text, font: e.target.value})} style={{ flex: 1, padding: 8, background: '#0d0d18', border: '1px solid #2a2a3e', borderRadius: 8, color: '#eee' }}>
                  {FONTS.map(f => <option key={f}>{f}</option>)}
                </select>
              </InputRow>
              <InputRow label="Weight">
                <select value={text.weight} onChange={e => setText({...text, weight: e.target.value})} style={{ flex: 1, padding: 8, background: '#0d0d18', border: '1px solid #2a2a3e', borderRadius: 8, color: '#eee' }}>
                  <option>Normal</option><option>Bold</option><option>Italic</option>
                </select>
              </InputRow>
              <InputRow label="Align">
                <select value={text.align} onChange={e => setText({...text, align: e.target.value})} style={{ flex: 1, padding: 8, background: '#0d0d18', border: '1px solid #2a2a3e', borderRadius: 8, color: '#eee' }}>
                  <option>Left</option><option>Center</option><option>Right</option><option>Justify</option>
                </select>
              </InputRow>
              <div style={{ marginTop: 24, borderTop: '1px solid #1e1e2e', paddingTop: 20 }}>
                <InputRow label="Font Size"><Slider val={text.size} min={14} max={60} step={1} unit="px" onChange={v => setText({...text, size: v})} /></InputRow>
                <InputRow label="Line Height"><Slider val={text.lineH} min={1} max={2.5} step={0.1} unit="x" onChange={v => setText({...text, lineH: v})} /></InputRow>
                <InputRow label="Letter Spacing"><Slider val={text.letterS} min={-2} max={10} step={0.5} unit="px" onChange={v => setText({...text, letterS: v})} /></InputRow>
              </div>
            </div>
          )}

          {activeTab === 'bg' && (
            <div>
              <InputRow label="Style">
                <select value={bg.type} onChange={e => setBg({...bg, type: e.target.value})} style={{ flex: 1, padding: 8, background: '#0d0d18', border: '1px solid #2a2a3e', borderRadius: 8, color: '#eee' }}>
                  <option>Solid</option><option>Gradient</option><option>Media</option>
                </select>
              </InputRow>
              <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <div style={{ flex: 1, background: '#0d0d18', padding: 12, borderRadius: 10, border: '1px solid #1e1e2e' }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>BG</div>
                  <ColorBtn color={bg.color} onClick={() => openPicker('bgColor', bg.color)} />
                </div>
                <div style={{ flex: 1, background: '#0d0d18', padding: 12, borderRadius: 10, border: '1px solid #1e1e2e' }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>Card</div>
                  <ColorBtn color={bg.color2} onClick={() => openPicker('bgCard', bg.color2)} />
                </div>
              </div>
              <div style={{ background: '#0d0d18', padding: 16, borderRadius: 12, border: '1px solid #1e1e2e', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Media Link / Local File</div>
                  <button onClick={() => setBg({...bg, type: 'Media', media: `https://picsum.photos/1080/1920?random=${Date.now()}`})} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #7c3aed', background: '#2a1050', color: '#a78bfa', fontSize: 10, cursor: 'pointer', fontWeight: 600 }}>
                    ✨ Pixabay Random
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <label style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #2a2a3e', background: '#1a1a2e', color: '#a78bfa', fontSize: 12, cursor: 'pointer', flexShrink: 0, fontWeight: 600 }}>
                    UPLOAD MEDIA
                    <input type="file" accept="image/*,video/*" hidden onChange={(e) => handleFileUpload(e, 'media')} />
                  </label>
                  <input value={bg.media} onChange={e => setBg({...bg, media: e.target.value})} placeholder="Or paste https://example.com/clip.mp4" style={{ flex: 1, background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 6, color: '#fff', padding: '6px 10px', fontSize: 12 }} />
                </div>
                <div style={{ fontSize: 10, color: '#666' }}>Supports .mp4 / .webm / .mov videos and image URLs (jpg, png, webp, gif) from PC or link.</div>
              </div>
              <InputRow label="Card Radius"><Slider val={bg.radius} min={0} max={60} step={1} unit="px" onChange={v => setBg({...bg, radius: v})} /></InputRow>
              <InputRow label="Card Padding"><Slider val={bg.padding} min={0} max={80} step={1} unit="px" onChange={v => setBg({...bg, padding: v})} /></InputRow>
              <InputRow label="Card Alpha"><Slider val={bg.alpha} min={0} max={100} step={1} unit="%" onChange={v => setBg({...bg, alpha: v})} /></InputRow>
              <InputRow label="Show Profile">
                <input type="checkbox" checked={bg.showProfile} onChange={e => setBg({...bg, showProfile: e.target.checked})} />
              </InputRow>
            </div>
          )}

          {activeTab === 'footer' && (
            <div>
              <InputRow label="Style">
                <select value={footer.type} onChange={e => setFooter({...footer, type: e.target.value})} style={{ flex: 1, padding: 8, background: '#0d0d18', border: '1px solid #2a2a3e', borderRadius: 8, color: '#eee' }}>
                  <option>Fit to text</option><option>Fit to card</option><option>Fill</option><option>None</option>
                </select>
              </InputRow>
              <InputRow label="Text">
                <input value={footer.text} onChange={e => setFooter({...footer, text: e.target.value})} style={{ flex: 1, background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 6, color: '#fff', padding: '6px 10px' }} />
                <Btn>⚡</Btn>
              </InputRow>
              <div style={{ display: 'flex', gap: 12, marginBottom: 24, marginTop: 16 }}>
                <div style={{ flex: 1, background: '#0d0d18', padding: 12, borderRadius: 10, border: '1px solid #1e1e2e' }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>Text Color</div>
                  <ColorBtn color={footer.color} onClick={() => openPicker('footerColor', footer.color)} />
                </div>
                <div style={{ flex: 1, background: '#0d0d18', padding: 12, borderRadius: 10, border: '1px solid #1e1e2e' }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>BG Color</div>
                  <ColorBtn color={footer.bgColor} onClick={() => openPicker('footerBg', footer.bgColor)} />
                </div>
              </div>
              <InputRow label="Show Footer">
                <input type="checkbox" checked={footer.show} onChange={e => setFooter({...footer, show: e.target.checked})} />
              </InputRow>
            </div>
          )}

        </div>
      </div>

      {/* RIGHT: Preview Canvas */}
      <div style={{ flex: 1, background: '#08080f', display: 'flex', flexDirection: 'column' }}>
        {/* Top Control Bar */}
        <div style={{ padding: '20px 28px', borderBottom: '1px solid #1e1e2e', display: 'flex', justifyContent: 'center', gap: 12 }}>
          <Btn onClick={handleReset}>⟳ Reset</Btn>
          <Btn onClick={handleNewPoster}>⚡ New Poster</Btn>
          <Btn onClick={handleSaveTemplate}>💾 Save Template</Btn>
          <button onClick={() => setExportOpen(true)} style={{
            padding: '8px 24px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#ec4899)',
            color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(124,58,237,0.3)'
          }}>📥 Download</button>
        </div>

        {/* Live Preview Wrapper */}
        <div style={{ flex: 1, padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          
          {/* Virtual Phone Canvas (9:16 aspect ratio roughly, scaled down) */}
          <div style={{
            width: 400, height: 711, background: bg.type === 'Gradient' ? `linear-gradient(to bottom, ${bg.color}, ${bg.color2})` : bg.color,
            borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}>
            {/* Background Media handling (Image vs Video) */}
            {bg.type === 'Media' && bg.media && (
              bg.mediaType === 'video' || bg.media.match(/\.(mp4|webm|mov)$/i) ? (
                <video src={bg.media} autoPlay loop muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
              ) : (
                <img src={bg.media} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
              )
            )}
            
            {/* Overlay Box (Card) */}
            <div style={{
              background: `rgba(26, 26, 46, ${bg.alpha / 100})`,
              borderRadius: bg.radius,
              padding: bg.padding,
              width: '100%',
              display: 'flex', flexDirection: 'column', gap: 16,
              zIndex: 10
            }}>
              
              {/* Profile Section */}
              {bg.showProfile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#3a3a4e', overflow: 'hidden' }}>
                    {profile.avatar ? <img src={profile.avatar} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24}}>👤</div>}
                  </div>
                  <div>
                    <div style={{
                      fontFamily: profile.font, fontSize: profile.size, color: profile.color, fontWeight: 700,
                      background: profile.showBg ? 'rgba(0,0,0,0.5)' : 'transparent', padding: profile.showBg ? '2px 8px' : 0, borderRadius: 4
                    }}>{profile.name}</div>
                    <div style={{ fontSize: 14, color: '#888' }}>{profile.subtitle}</div>
                  </div>
                </div>
              )}

              {/* Text Section */}
              <div style={{
                fontFamily: text.font, fontWeight: text.weight === 'Normal' ? 400 : text.weight === 'Bold' ? 700 : text.weight === 'Italic' ? 400 : 700,
                fontStyle: text.weight.includes('Italic') ? 'italic' : 'normal',
                textAlign: text.align.toLowerCase(),
                fontSize: text.size,
                lineHeight: text.lineH,
                letterSpacing: text.letterS,
                color: text.color,
              }}>
                {parseContent(text.content)}
              </div>

            </div>

            {/* Footer */}
            {footer.show && (
              <div style={{
                position: 'absolute', bottom: 40,
                background: footer.type === 'None' ? 'transparent' : footer.bgColor,
                color: footer.color,
                padding: footer.type === 'Fit to text' ? '8px 16px' : '12px',
                borderRadius: footer.type === 'Fit to text' ? 20 : 0,
                width: footer.type === 'Fill' ? '100%' : footer.type === 'Fit to card' ? `calc(100% - 40px)` : 'auto',
                textAlign: 'center', fontSize: 14, fontWeight: 600,
              }}>
                {footer.text}
              </div>
            )}
          </div>

        </div>
      </div>

      {colorPicker && <ColorPicker color={colorPicker.val} onChange={handleColorChange} onClose={() => setColorPicker(null)} />}
      {exportOpen && (
        <ExportWizard 
          onClose={() => setExportOpen(false)} 
          storyMakerCustom={{
            storyMakerCustom: true,
            profile,
            text,
            bg,
            footer
          }}
          storyContent={text.content}
          articleId={selectedArticleId}
        />
      )}
    </div>
  );
}
