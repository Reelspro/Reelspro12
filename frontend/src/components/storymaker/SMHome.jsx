import React from 'react';

export default function SMHome({ user }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = user?.name || user?.email?.split('@')[0] || 'Creator';

  const metrics = [
    { label: 'Saved Templates', value: '0', icon: '📋', color: '#7c3aed' },
    { label: 'Gallery Images', value: '0', icon: '🖼️', color: '#0ea5e9' },
    { label: 'Gallery Videos', value: '0', icon: '🎬', color: '#ec4899' },
    { label: 'Account Status', value: 'Active', icon: '✅', color: '#10b981' },
  ];

  return (
    <div style={{ padding: 32, overflowY: 'auto', height: '100%' }}>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg,#1a0a2e,#0d1a3a)',
        borderRadius: 20, padding: '36px 40px', marginBottom: 28,
        border: '1px solid #2a1a4e', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -20, top: -20, fontSize: 120, opacity: 0.08 }}>⚡</div>
        <div style={{ fontSize: 13, color: '#a78bfa', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 2 }}>
          Welcome back
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, background: 'linear-gradient(135deg,#fff,#c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {greeting}, {name}!
        </h1>
        <p style={{ color: '#7777aa', marginTop: 8, fontSize: 14 }}>Ready to create something amazing today?</p>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {metrics.map(m => (
          <div key={m.label} style={{
            background: '#0d0d18', border: '1px solid #1e1e2e', borderRadius: 16,
            padding: '24px 20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{m.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
