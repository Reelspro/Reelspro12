import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import SMHome from '../components/storymaker/SMHome';
import SMWorkspace from '../components/storymaker/SMWorkspace';
import SMTemplates from '../components/storymaker/SMTemplates';
import SMGallery from '../components/storymaker/SMGallery';
import SMNotifications from '../components/storymaker/SMNotifications';
import SMJobs from '../components/storymaker/SMJobs';
import SMCache from '../components/storymaker/SMCache';

const NAV = [
  { id: 'back_dash', icon: '⬅️', label: 'Back to Dashboard', isLink: true, path: '/dashboard' },
  { id: 'admin_panel', icon: '🛠️', label: 'Admin Panel', isLink: true, path: '/admin/dashboard', requireAdmin: true },
  { id: 'home', icon: '🏠', label: 'Home' },
  { id: 'story', icon: '✍️', label: 'Story Maker' },
  { id: 'templates', icon: '📋', label: 'Templates' },
  { id: 'gallery', icon: '🖼️', label: 'Gallery' },
  { id: 'notifications', icon: '🔔', label: 'Notifications' },
  { id: 'jobs', icon: '⚙️', label: 'Jobs' },
  { id: 'cache', icon: '💾', label: 'Cache' },
];

export default function StoryMaker() {
  const [tab, setTab] = useState('story');
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const renderContent = () => {
    switch (tab) {
      case 'home': return <SMHome user={user} setTab={setTab} />;
      case 'story': return <SMWorkspace setTab={setTab} />;
      case 'templates': return <SMTemplates setTab={setTab} />;
      case 'gallery': return <SMGallery />;
      case 'notifications': return <SMNotifications />;
      case 'jobs': return <SMJobs />;
      case 'cache': return <SMCache />;
      default: return <SMWorkspace setTab={setTab} />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#08080f', color: '#e8e8f0', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{ width: 260, background: '#0d0d12', borderRight: '1px solid #1e1e2e', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid #1e1e2e' }}>
          <div style={{ fontSize: 20, fontWeight: 800, background: 'linear-gradient(135deg,#a78bfa,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ⚡ StoryMaker
          </div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>Video Generation Studio</div>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {NAV.map(n => {
            if (n.requireAdmin && user?.role !== 'admin') return null;
            return (
              <button key={n.id} onClick={() => {
                if (n.isLink) navigate(n.path);
                else setTab(n.id);
              }} style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                marginBottom: 2, fontSize: 13, fontWeight: tab === n.id ? 600 : 400,
                background: tab === n.id && !n.isLink ? 'linear-gradient(135deg,#7c3aed22,#ec489922)' : 'transparent',
                color: tab === n.id && !n.isLink ? '#a78bfa' : '#9999bb',
                borderLeft: tab === n.id && !n.isLink ? '3px solid #a78bfa' : '3px solid transparent',
                transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: 16 }}>{n.icon}</span>
                {n.label}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid #1e1e2e' }}>
          <div style={{ fontSize: 11, color: '#555', padding: '0 14px 8px' }}>
            {user?.email || 'user@example.com'}
          </div>
          <button onClick={logout} style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%',
            padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'transparent', color: '#ef4444', fontSize: 13, fontWeight: 500,
          }}>
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {renderContent()}
      </main>
    </div>
  );
}
