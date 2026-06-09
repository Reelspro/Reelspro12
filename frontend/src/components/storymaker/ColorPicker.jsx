import React, { useState, useRef } from 'react';

const PRESET_COLORS = [
  '#000000','#1a1a1a','#333333','#555555','#777777','#999999','#bbbbbb','#ffffff',
  '#1a0033','#3d0080','#7c3aed','#a78bfa','#c4b5fd','#ede9fe','#ddd6fe','#f5f3ff',
  '#1e1b4b','#312e81','#3730a3','#4f46e5','#6366f1','#818cf8','#a5b4fc','#e0e7ff',
  '#0c4a6e','#0369a1','#0284c7','#0ea5e9','#38bdf8','#7dd3fc','#bae6fd','#e0f2fe',
  '#064e3b','#065f46','#047857','#059669','#10b981','#34d399','#6ee7b7','#d1fae5',
  '#7f1d1d','#991b1b','#b91c1c','#dc2626','#ef4444','#f87171','#fca5a5','#fee2e2',
];

export default function ColorPicker({ color, onChange, onClose }) {
  const [hex, setHex] = useState(color || '#7c3aed');
  const [hue, setHue] = useState(270);

  const apply = (c) => { setHex(c); onChange && onChange(c); };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#12121e', border: '1px solid #2a2a3e', borderRadius: 16, padding: 24, width: 500, maxWidth: '95vw' }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, color: '#e8e8f0' }}>Select Color</div>
        <div style={{ display: 'flex', gap: 20 }}>
          {/* Left: Swatches */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 4, marginBottom: 12 }}>
              {PRESET_COLORS.map(c => (
                <div key={c} onClick={() => apply(c)} style={{
                  width: '100%', aspectRatio: '1', borderRadius: 4, background: c, cursor: 'pointer',
                  border: hex === c ? '2px solid #a78bfa' : '2px solid transparent',
                  boxSizing: 'border-box',
                }} />
              ))}
            </div>
            <button style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #2a2a3e', background: '#1a1a2e', color: '#aaa', fontSize: 12, cursor: 'pointer', marginBottom: 10 }}>
              🖱️ Pick Screen Color
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 4, marginBottom: 8 }}>
              {Array(16).fill(null).map((_, i) => (
                <div key={i} style={{ width: '100%', aspectRatio: '1', borderRadius: 4, background: '#fff', border: '1px solid #2a2a3e' }} />
              ))}
            </div>
            <button style={{ width: '100%', padding: '7px', borderRadius: 8, border: '1px solid #2a2a3e', background: '#1a1a2e', color: '#aaa', fontSize: 11, cursor: 'pointer' }}>
              + Add to Custom Colors
            </button>
          </div>

          {/* Right: Spectrum + Controls */}
          <div style={{ width: 180 }}>
            {/* Gradient canvas */}
            <div style={{
              height: 140, borderRadius: 8, marginBottom: 10, position: 'relative', cursor: 'crosshair',
              background: `linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%), linear-gradient(to right, #fff 0%, hsl(${hue},100%,50%) 100%)`,
            }}>
              <div style={{ position: 'absolute', top: '30%', left: '70%', width: 12, height: 12, borderRadius: '50%', border: '2px solid #fff', transform: 'translate(-50%,-50%)' }}>+</div>
            </div>
            {/* Hue slider */}
            <input type="range" min={0} max={360} value={hue} onChange={e => setHue(+e.target.value)}
              style={{ width: '100%', accentColor: `hsl(${hue},100%,50%)`, marginBottom: 12 }} />

            {/* Input fields */}
            {[['H', hue, 0, 360], ['S', 100, 0, 100], ['V', 80, 0, 100]].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <label style={{ fontSize: 11, color: '#666', width: 14 }}>{l}</label>
                <input type="number" defaultValue={v} style={{ flex: 1, background: '#0d0d18', border: '1px solid #2a2a3e', borderRadius: 6, color: '#e8e8f0', padding: '4px 6px', fontSize: 12 }} />
              </div>
            ))}
            {[['R', 124], ['G', 58], ['B', 237]].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <label style={{ fontSize: 11, color: '#666', width: 14 }}>{l}</label>
                <input type="number" defaultValue={v} style={{ flex: 1, background: '#0d0d18', border: '1px solid #2a2a3e', borderRadius: 6, color: '#e8e8f0', padding: '4px 6px', fontSize: 12 }} />
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: '#666' }}>HTML</label>
              <input value={hex} onChange={e => apply(e.target.value)}
                style={{ flex: 1, background: '#0d0d18', border: '1px solid #2a2a3e', borderRadius: 6, color: '#e8e8f0', padding: '4px 6px', fontSize: 12 }} />
              <div style={{ width: 24, height: 24, borderRadius: 4, background: hex, border: '1px solid #3a3a4e' }} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #2a2a3e', background: '#1a1a2e', color: '#aaa', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => { onChange && onChange(hex); onClose(); }} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>OK</button>
        </div>
      </div>
    </div>
  );
}
