import React, { useState, useRef, useEffect } from 'react';
import useReelStore from '../../store/reelStore';

// Step 1: Format selector
function ExportPanel({ onExport, onClose }) {
  const [format, setFormat] = useState('image');
  const [duration, setDuration] = useState(15);
  const fmts = [
    { id: 'image', icon: '🖼️', label: 'Image (PNG)', desc: 'Single 1080p Full HD photo' },
    { id: 'video', icon: '🎬', label: 'Video (Silent · Same Image)', desc: 'Looping video with subtitles' },
  ];
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
      <div style={{ background: '#12121e', border: '1px solid #2a2a3e', borderRadius: 20, padding: 28, width: 420, maxWidth: '95vw' }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Export Story</div>
        <div style={{ color: '#666', fontSize: 13, marginBottom: 20 }}>Choose your download format</div>
        {fmts.map(f => (
          <div key={f.id} onClick={() => setFormat(f.id)} style={{
            border: `2px solid ${format === f.id ? '#7c3aed' : '#2a2a3e'}`,
            borderRadius: 14, padding: '14px 18px', marginBottom: 10, cursor: 'pointer',
            background: format === f.id ? '#1a0a2e' : '#0d0d18',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>{f.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{f.label}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{f.desc}</div>
              </div>
            </div>
            {f.id === 'video' && format === 'video' && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#aaa', marginBottom: 6 }}>
                  <span>Duration</span><span style={{ color: '#a78bfa', fontWeight: 700 }}>{duration}s</span>
                </div>
                <input type="range" min={15} max={90} value={duration} onChange={e => setDuration(+e.target.value)}
                  style={{ width: '100%', accentColor: '#7c3aed' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#555' }}>
                  <span>15s</span><span>1m 30s</span>
                </div>
              </div>
            )}
          </div>
        ))}
        <button onClick={() => onExport({ format, duration })} style={{
          width: '100%', padding: '14px', borderRadius: 12, border: 'none', marginTop: 6,
          background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
        }}>📥 Export Video</button>
        <button onClick={onClose} style={{ width: '100%', padding: '10px', borderRadius: 12, border: '1px solid #2a2a3e', background: 'transparent', color: '#666', fontSize: 13, cursor: 'pointer', marginTop: 8 }}>
          🎞️ Bulk Generate
        </button>
      </div>
    </div>
  );
}

// Step 2: Audio panel — loads tracks dynamically from database
const VOICES = [
  { id: 1, name: 'Aria', info: 'US, Female · Warm and conversational' },
  { id: 2, name: 'Jenny', info: 'US, Female · Emotional & Slow · Recommended' },
  { id: 3, name: 'Guy', info: 'US, Male · Deep & Professional' },
  { id: 4, name: 'Michelle', info: 'US, Female · Soft & Calm' },
];

const CAT_ICONS = {
  horror: '👻', suspense: '😰', mystery: '🔍', crime: '🔫',
  emotional: '💔', motivational: '🔥', funny: '😂', shocking: '⚡', all: '🎵'
};
const CAT_COLORS = {
  horror: '#ef4444', suspense: '#8b5cf6', mystery: '#3b82f6', crime: '#6b7280',
  emotional: '#ec4899', motivational: '#f59e0b', funny: '#22c55e', shocking: '#f97316', all: '#7c3aed'
};

function AudioPanel({ onConfirm, onClose }) {
  const [tab, setTab] = useState('music');
  const [tracks, setTracks] = useState([]);
  const [selTrack, setSelTrack] = useState(null);
  const [selVoice, setSelVoice] = useState(VOICES[1]); // Jenny default (emotional)
  const [vol, setVol] = useState(65);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [playingId, setPlayingId] = useState(null);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [activeCat, setActiveCat] = useState('all');
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const audioRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const ASSETS_URL = API_URL.replace('/api', '/assets');

  // Fetch tracks
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/reels/music`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setTracks(data);
          // Auto-select first suspense or emotional track
          const def = data.find(t => t.category === 'suspense') || data.find(t => t.category === 'emotional') || data[0];
          setSelTrack(def);
          // Build unique category list
          const cats = ['all', ...new Set(data.map(t => t.category))];
          setCategories(cats);
        }
      } catch (e) { console.warn('Music fetch failed:', e); }
      setLoadingTracks(false);
    };
    fetchTracks();
    return () => { if (audioRef.current) audioRef.current.pause(); };
  }, []);

  const getMusicUrl = (track) => {
    if (!track?.file_path) return null;
    const match = track.file_path.match(/music[/\\](.+)/i);
    return match ? `${ASSETS_URL}/music/${match[1].replace(/\\/g, '/')}` : null;
  };

  const playTrack = (track) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (playingId === track.id) { setPlayingId(null); return; }
    const url = getMusicUrl(track);
    if (!url) return;
    const a = new Audio(url);
    a.volume = vol / 100;
    a.play().then(() => setPlayingId(track.id)).catch(() => setPlayingId(null));
    a.onended = () => setPlayingId(null);
    audioRef.current = a;
  };

  const stopAll = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setPlayingId(null);
  };

  const handleVol = (v) => {
    setVol(v);
    if (audioRef.current) audioRef.current.volume = v / 100;
  };

  const selectTrack = (t) => { stopAll(); setSelTrack(t); };

  const filtered = tracks.filter(t =>
    (activeCat === 'all' || t.category === activeCat) &&
    (!search || t.filename.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()))
  );

  const previewVoice = (name) => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance('This is a preview of the ' + name + ' voice. Slow, emotional storytelling.');
    utter.rate = 0.85; utter.pitch = 0.9;
    const vs = window.speechSynthesis.getVoices();
    const m = vs.find(v => v.name.toLowerCase().includes(name.toLowerCase()));
    if (m) utter.voice = m;
    window.speechSynthesis.speak(utter);
  };

  const panelStyle = { background: '#12121e', border: '1px solid #2a2a3e', borderRadius: 22, padding: 24, width: 520, maxWidth: '96vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
      <div style={panelStyle}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 19 }}>🎬 Audio for Your Reel</div>
            <div style={{ color: '#666', fontSize: 12, marginTop: 2 }}>Pick background music + voice for your video</div>
          </div>
          <button onClick={onClose} style={{ background: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: 8, color: '#666', width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: '#0a0a14', borderRadius: 12, padding: 4, marginBottom: 16 }}>
          {[['music', '🎵 Background Music'], ['voice', '🎙️ Voice Narration']].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '9px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: tab === t ? 'linear-gradient(135deg,#7c3aed,#ec4899)' : 'transparent',
              color: tab === t ? '#fff' : '#555', fontWeight: 700, fontSize: 13,
            }}>{label}</button>
          ))}
        </div>

        {/* MUSIC TAB */}
        {tab === 'music' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Enable Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0d0d18', padding: '10px 14px', borderRadius: 10, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e8f0' }}>🎵 Background Music</div>
                <div style={{ fontSize: 11, color: '#555' }}>{tracks.length} tracks available · Emotional & Suspense</div>
              </div>
              <div onClick={() => setMusicEnabled(v => !v)} style={{
                width: 44, height: 24, borderRadius: 12, background: musicEnabled ? '#7c3aed' : '#1e1e2e',
                position: 'relative', cursor: 'pointer', transition: 'background 0.2s', border: '1px solid #2a2a3e'
              }}>
                <div style={{ position: 'absolute', top: 3, left: musicEnabled ? 22 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </div>
            </div>

            {musicEnabled && (
              <>
                {/* Search */}
                <input
                  placeholder="🔍 Search tracks..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ background: '#0d0d18', border: '1px solid #1e1e2e', borderRadius: 9, padding: '8px 12px', color: '#e8e8f0', fontSize: 13, marginBottom: 10, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                />

                {/* Category Pills */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setActiveCat(cat)} style={{
                      padding: '5px 11px', borderRadius: 20, border: `1px solid ${activeCat === cat ? CAT_COLORS[cat] || '#7c3aed' : '#1e1e2e'}`,
                      background: activeCat === cat ? (CAT_COLORS[cat] || '#7c3aed') + '22' : 'transparent',
                      color: activeCat === cat ? CAT_COLORS[cat] || '#a78bfa' : '#555',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}>
                      {CAT_ICONS[cat] || '🎵'} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      {cat !== 'all' && <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.7 }}>({tracks.filter(t => t.category === cat).length})</span>}
                    </button>
                  ))}
                </div>

                {/* Track List */}
                {loadingTracks ? (
                  <div style={{ textAlign: 'center', padding: 24, color: '#555' }}>⏳ Loading tracks...</div>
                ) : filtered.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 24, color: '#555' }}>No tracks found</div>
                ) : (
                  <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12, paddingRight: 2 }}>
                    {filtered.map(t => {
                      const isPlaying = playingId === t.id;
                      const isSelected = selTrack?.id === t.id;
                      const catColor = CAT_COLORS[t.category] || '#7c3aed';
                      return (
                        <div key={t.id} onClick={() => selectTrack(t)} style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                          borderRadius: 11, cursor: 'pointer', marginBottom: 4,
                          background: isSelected ? catColor + '18' : isPlaying ? '#1e1e2e' : 'transparent',
                          border: `1px solid ${isSelected ? catColor : isPlaying ? '#2a2a3e' : 'transparent'}`,
                          transition: 'all 0.15s',
                        }}>
                          {/* Category icon */}
                          <div style={{ width: 36, height: 36, borderRadius: 9, background: catColor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                            {CAT_ICONS[t.category] || '🎵'}
                          </div>
                          {/* Track info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? '#fff' : '#c8c8e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {t.filename.replace(/\.[^.]+$/, '').replace(/_/g, ' ')}
                            </div>
                            <div style={{ fontSize: 11, color: catColor, marginTop: 1 }}>
                              {t.category.charAt(0).toUpperCase() + t.category.slice(1)} {t.duration ? `· ${t.duration}` : '· 45s'}
                            </div>
                          </div>
                          {/* Animated bars when playing */}
                          {isPlaying && (
                            <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 20 }}>
                              {[1,2,3,4].map(i => (
                                <div key={i} style={{
                                  width: 3, borderRadius: 2, background: catColor,
                                  animation: `eq${i} 0.${4+i}s ease-in-out infinite alternate`,
                                  height: `${[10,16,12,18][i-1]}px`,
                                }} />
                              ))}
                            </div>
                          )}
                          {/* Play / Stop button */}
                          <button onClick={e => { e.stopPropagation(); playTrack(t); }} style={{
                            width: 32, height: 32, borderRadius: 8, border: 'none', flexShrink: 0,
                            background: isPlaying ? catColor : '#1e1e2e',
                            color: isPlaying ? '#fff' : '#666', fontSize: 13, cursor: 'pointer',
                          }}>
                            {isPlaying ? '■' : '▶'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Volume + Now Playing */}
                {selTrack && (
                  <div style={{ background: '#0d0d18', borderRadius: 10, padding: '10px 14px', marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: '#555', marginBottom: 6 }}>
                      Selected: <span style={{ color: CAT_COLORS[selTrack.category] || '#a78bfa', fontWeight: 600 }}>
                        {selTrack.filename.replace(/\.[^.]+$/, '').replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, color: '#555', width: 50 }}>🔊 {vol}%</span>
                      <input type="range" min={0} max={100} value={vol} onChange={e => handleVol(+e.target.value)}
                        style={{ flex: 1, accentColor: CAT_COLORS[selTrack.category] || '#7c3aed' }} />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button onClick={() => { stopAll(); onConfirm({ voiceEnabled, voice: selVoice?.name || 'Jenny', musicEnabled: false, musicId: 'none' }); }} style={{ padding: '9px 16px', borderRadius: 9, border: '1px solid #2a2a3e', background: 'transparent', color: '#666', fontSize: 13, cursor: 'pointer' }}>
                No Music
              </button>
              <button onClick={() => { stopAll(); onConfirm({ voiceEnabled, voice: selVoice?.name || 'Jenny', musicEnabled, musicId: musicEnabled && selTrack ? selTrack.id : 'none' }); }} style={{ padding: '9px 20px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                ✓ Continue →
              </button>
            </div>
          </div>
        )}

        {/* VOICE TAB */}
        {tab === 'voice' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Enable Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0d0d18', padding: '10px 14px', borderRadius: 10, marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e8f0' }}>🎙️ Voice Narration</div>
                <div style={{ fontSize: 11, color: '#555' }}>AI reads your story with emotional tone</div>
              </div>
              <div onClick={() => setVoiceEnabled(v => !v)} style={{
                width: 44, height: 24, borderRadius: 12, background: voiceEnabled ? '#7c3aed' : '#1e1e2e',
                position: 'relative', cursor: 'pointer', transition: 'background 0.2s', border: '1px solid #2a2a3e'
              }}>
                <div style={{ position: 'absolute', top: 3, left: voiceEnabled ? 22 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </div>
            </div>

            {voiceEnabled && (
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: 14 }}>
                {VOICES.map(v => (
                  <div key={v.id} onClick={() => setSelVoice(v)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    borderRadius: 11, cursor: 'pointer', marginBottom: 6,
                    background: selVoice?.id === v.id ? '#1a0a2e' : '#0d0d18',
                    border: `1px solid ${selVoice?.id === v.id ? '#7c3aed' : '#1e1e2e'}`,
                  }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: selVoice?.id === v.id ? '#7c3aed33' : '#1e1e2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      🎙️
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: selVoice?.id === v.id ? '#a78bfa' : '#e8e8f0' }}>
                        {v.name} {v.id === 2 && <span style={{ fontSize: 10, background: '#7c3aed33', color: '#a78bfa', borderRadius: 5, padding: '2px 6px', marginLeft: 4 }}>Recommended</span>}
                      </div>
                      <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{v.info}</div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); previewVoice(v.name); }} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #2a2a3e', background: '#1a1a2e', color: '#aaa', fontSize: 11, cursor: 'pointer' }}>
                      ▶ Preview
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 9, border: '1px solid #2a2a3e', background: 'transparent', color: '#666', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { stopAll(); onConfirm({ voiceEnabled, voice: selVoice?.name || 'Jenny', musicEnabled, musicId: musicEnabled && selTrack ? selTrack.id : 'none' }); }} style={{ padding: '9px 20px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                ✓ Generate Video →
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Equalizer animation */}
      <style>{`
        @keyframes eq1 { from { height: 6px } to { height: 16px } }
        @keyframes eq2 { from { height: 12px } to { height: 20px } }
        @keyframes eq3 { from { height: 8px } to { height: 14px } }
        @keyframes eq4 { from { height: 16px } to { height: 22px } }
      `}</style>
    </div>
  );
}


// Step 3: Render progress modal
function RenderModal({ duration, audio, onClose, storyMakerCustom, storyContent, articleId }) {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const ref = useRef(null);
  const { generateReel } = useReelStore();
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (hasTriggered.current) return;
    hasTriggered.current = true;
    const voice = audio?.voiceEnabled ? audio.voice : 'none';
    const musicId = audio?.musicEnabled ? audio.musicId : 'none';
    const musicEnabled = audio?.musicEnabled ?? false;
    
    const customPayload = {
      voice,
      musicId,
      musicEnabled,
      ...(storyMakerCustom || {})
    };
    
    generateReel('suspense', customPayload, duration, 'all', 'pixabay', null, storyContent, articleId);
  }, [generateReel, duration, audio, storyMakerCustom, storyContent, articleId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(timer); setDone(true); return 100; }
        return p + Math.random() * 8;
      });
    }, 300);
    return () => clearInterval(timer);
  }, []);

  const pct = Math.min(100, Math.round(progress));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
      <div style={{ background: '#12121e', border: '1px solid #2a2a3e', borderRadius: 20, padding: 28, width: 440, maxWidth: '95vw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Video Generate</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ background: '#0d0d18', border: '1px solid #1e1e2e', borderRadius: 14, padding: '14px 18px', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 24 }}>🎬</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>video_1.mp4</div>
              <div style={{ fontSize: 12, color: done ? '#4ade80' : '#a78bfa' }}>
                {done ? '✅ Completed' : `Processing (${pct}%)`}
              </div>
            </div>
            <button style={{ background: '#2a1a2e', border: 'none', color: '#ec4899', fontSize: 16, cursor: 'pointer', borderRadius: 8, padding: '4px 8px' }}>🗑️</button>
          </div>
          <div style={{ background: '#1a1a2e', borderRadius: 99, height: 8, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`, borderRadius: 99, transition: 'width 0.3s',
              background: done ? 'linear-gradient(90deg,#4ade80,#22d3ee)' : 'linear-gradient(90deg,#2563eb,#7c3aed)',
            }} />
          </div>
        </div>
        {done && (
          <div style={{ textAlign: 'center', color: '#4ade80', fontSize: 14, fontWeight: 600 }}>
            ✅ Added to Gallery → Videos → Bulk Video Runs
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExportWizard({ onClose, storyMakerCustom, storyContent, articleId }) {
  const [step, setStep] = useState(1);
  const [exportOpts, setExportOpts] = useState(null);
  const [audioOpts, setAudioOpts] = useState(null);

  if (step === 1) return <ExportPanel onClose={onClose} onExport={opts => { setExportOpts(opts); setStep(2); }} />;
  if (step === 2) return <AudioPanel onClose={onClose} onConfirm={(audio) => { setAudioOpts(audio); setStep(3); }} />;
  if (step === 3) return <RenderModal duration={exportOpts?.duration || 15} audio={audioOpts} onClose={onClose} storyMakerCustom={storyMakerCustom} storyContent={storyContent} articleId={articleId} />;
  return null;
}
