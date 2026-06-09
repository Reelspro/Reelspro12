import React, { useState } from 'react';

const RUNS = [
  { id: 1, name: 'bulk_5', count: 0, date: 'May 10, 2026' },
];

export default function SMGallery() {
  const [sub, setSub] = useState('images');
  return (
    <div style={{ padding: 28, height: '100%', overflowY: 'auto' }}>
      <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700 }}>Gallery</h2>
      {/* Sub Nav */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: '#0d0d18', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {['images','videos'].map(s => (
          <button key={s} onClick={() => setSub(s)} style={{
            padding: '8px 20px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, textTransform: 'capitalize',
            background: sub === s ? 'linear-gradient(135deg,#7c3aed,#ec4899)' : 'transparent',
            color: sub === s ? '#fff' : '#666',
          }}>{s}</button>
        ))}
      </div>

      {sub === 'images' && (
        <div style={{ color: '#555', textAlign: 'center', paddingTop: 60, fontSize: 14 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📷</div>
          No images yet. Download renders from Story Maker.
        </div>
      )}

      {sub === 'videos' && (
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#aaa', marginBottom: 14 }}>Bulk Video Runs</h3>
          {RUNS.map(r => (
            <div key={r.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: '#0d0d18', border: '1px solid #1e1e2e', borderRadius: 14,
              padding: '14px 18px', marginBottom: 10,
            }}>
              <span style={{ fontSize: 28 }}>📁</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: '#555' }}>{r.count} items • {r.date}</div>
              </div>
              <button style={{ padding: '6px 14px', borderRadius: 8, background: '#1a2a1e', border: '1px solid #2a4a2e', color: '#4ade80', fontSize: 12, cursor: 'pointer' }}>✓ Open</button>
              <button style={{ padding: '6px 10px', borderRadius: 8, background: '#2a1a1e', border: '1px solid #4a2a2e', color: '#f87171', fontSize: 14, cursor: 'pointer' }}>🗑️</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
