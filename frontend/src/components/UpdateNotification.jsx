import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';

/* ── Bytes → human readable ── */
function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export default function UpdateNotification() {
  const { token } = useAuthStore();

  const [info, setInfo]           = useState(null);   // update info from API
  const [visible, setVisible]     = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded]   = useState(false);

  /* ── Auto-check on mount ────────────────────── */
  useEffect(() => {
    if (!token) return;

    checkUpdate();

    // Re-check every 6 hours while app is open
    const interval = setInterval(checkUpdate, 6 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [token]);

  async function checkUpdate() {
    try {
      const res = await fetch('/api/update/check', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.updateAvailable) {
        // If it's a regular update and dismissed recently, skip showing
        const ts = localStorage.getItem('updateDismissedAt');
        if (!data.forceUpdate && ts && Date.now() - Number(ts) < 86_400_000) {
          return;
        }

        setInfo(data);
        setVisible(true);
        if (data.forceUpdate) {
          setShowModal(true);
        }
      }
    } catch {
      /* silently fail */
    }
  }

  function dismiss() {
    if (info?.forceUpdate) return; // Cannot dismiss force update
    setVisible(false);
    localStorage.setItem('updateDismissedAt', Date.now().toString());
  }

  async function handleDownload() {
    if (!info?.downloadUrl) return;
    setDownloading(true);

    // Open download in new tab (browser handles .exe download)
    window.open(info.downloadUrl, '_blank');

    // Show "downloaded" state after 3 s
    setTimeout(() => {
      setDownloading(false);
      setDownloaded(true);
    }, 3000);
  }

  if (!visible || !info) return null;

  return (
    <>
      {/* ╔══ Floating Banner (bottom-right) ══╗ */}
      {!showModal && (
        <div style={{
          position: 'fixed',
          bottom: 28, right: 28,
          zIndex: 9999,
          width: 340,
          background: 'linear-gradient(145deg, #0d0d1a 0%, #111827 100%)',
          border: '1px solid rgba(99,102,241,0.45)',
          borderRadius: 18,
          padding: '18px 20px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.15)',
          color: '#fff',
          fontFamily: 'Inter, system-ui, sans-serif',
          animation: 'rp_slideUp 0.45s cubic-bezier(.22,1,.36,1)',
        }}>
          <style>{`
            @keyframes rp_slideUp {
              from { transform: translateY(32px); opacity: 0; }
              to   { transform: translateY(0);    opacity: 1; }
            }
            @keyframes rp_pulse {
              0%,100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.5); }
              50%      { box-shadow: 0 0 0 8px rgba(99,102,241,0); }
            }
          `}</style>

          {/* Header row */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{
                fontSize:11, fontWeight:700, letterSpacing:1,
                background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                borderRadius:20, padding:'3px 10px', color:'#fff',
                textTransform:'uppercase',
              }}>New Update</span>
              <span style={{ fontSize:13, fontWeight:700, color:'#a5b4fc' }}>
                v{info.latestVersion}
              </span>
            </div>
            {!info.forceUpdate && (
              <button onClick={dismiss}
                style={{ background:'none', border:'none', color:'#555', cursor:'pointer', fontSize:20, lineHeight:1 }}>
                ×
              </button>
            )}
          </div>

          {/* Release date */}
          {info.releaseDate && (
            <p style={{ margin:'0 0 8px', fontSize:12, color:'#64748b' }}>
              📅 Released {info.releaseDate}
              {info.fileSize ? `  ·  📦 ${formatSize(info.fileSize)}` : ''}
            </p>
          )}

          {/* Changelog top 3 */}
          {info.changelog?.length > 0 && (
            <ul style={{ margin:'6px 0 12px', padding:'0 0 0 16px', color:'#94a3b8', fontSize:12, lineHeight:1.8 }}>
              {info.changelog.slice(0,3).map((c,i) => <li key={i}>{c}</li>)}
              {info.changelog.length > 3 && (
                <li style={{ color:'#6366f1' }}>+{info.changelog.length-3} more...</li>
              )}
            </ul>
          )}

          {/* Buttons */}
          <div style={{ display:'flex', gap:8 }}>
            <button
              onClick={() => setShowModal(true)}
              style={{
                flex:1, padding:'10px 0', borderRadius:10, border:'none',
                background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer',
                animation: 'rp_pulse 2s infinite',
              }}>
              🚀 Update Now
            </button>
            {!info.forceUpdate && (
              <button onClick={dismiss}
                style={{
                  padding:'10px 14px', borderRadius:10,
                  background:'rgba(255,255,255,0.05)',
                  border:'1px solid rgba(255,255,255,0.08)',
                  color:'#64748b', fontSize:13, cursor:'pointer',
                }}>
                Later
              </button>
            )}
          </div>
        </div>
      )}

      {/* ╔══ Update Modal ══╗ */}
      {showModal && (
        <div style={{
          position:'fixed', inset:0, zIndex:10000,
          background:'rgba(0,0,0,0.8)', backdropFilter:'blur(8px)',
          display:'flex', alignItems:'center', justifyContent:'center',
          padding:16,
        }}>
          <div style={{
            background:'#0d0d1a',
            border:'1px solid rgba(99,102,241,0.35)',
            borderRadius:24,
            width:580, maxWidth:'100%',
            padding:36,
            color:'#fff',
            fontFamily:'Inter, system-ui, sans-serif',
            boxShadow:'0 48px 120px rgba(0,0,0,0.8)',
            position:'relative',
          }}>
            {/* Close */}
            {!info.forceUpdate && (
              <button onClick={() => { setShowModal(false); dismiss(); }}
                style={{
                  position:'absolute', top:18, right:18,
                  background:'rgba(255,255,255,0.06)', border:'none',
                  borderRadius:8, width:32, height:32, color:'#94a3b8',
                  fontSize:18, cursor:'pointer', display:'flex',
                  alignItems:'center', justifyContent:'center',
                }}>×</button>
            )}

            {/* Title */}
            <div style={{ marginBottom:24 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
                <span style={{ fontSize:36 }}>🚀</span>
                <div>
                  <h2 style={{ margin:0, fontSize:22, fontWeight:800, background:'linear-gradient(135deg,#a5b4fc,#8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                    ReelsPro {info.latestVersion} is Ready!
                  </h2>
                  <p style={{ margin:0, fontSize:13, color:'#475569' }}>
                    You are on v{info.localVersion} · New: v{info.latestVersion}
                    {info.fileSize ? ` · ${formatSize(info.fileSize)}` : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Changelog */}
            {info.changelog?.length > 0 && (
              <div style={{
                background:'rgba(99,102,241,0.07)',
                border:'1px solid rgba(99,102,241,0.18)',
                borderRadius:12, padding:'14px 18px', marginBottom:24,
              }}>
                <p style={{ margin:'0 0 10px', fontSize:11, fontWeight:700, color:'#6366f1', textTransform:'uppercase', letterSpacing:1 }}>
                  What's New in v{info.latestVersion}
                </p>
                <ul style={{ margin:0, paddingLeft:18, color:'#cbd5e1', fontSize:13, lineHeight:2 }}>
                  {info.changelog.map((c,i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}

            {/* How to update steps */}
            <div style={{
              background:'rgba(15,23,42,0.6)',
              border:'1px solid rgba(255,255,255,0.06)',
              borderRadius:12, padding:'14px 18px', marginBottom:24,
            }}>
              <p style={{ margin:'0 0 10px', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1 }}>
                How to Update
              </p>
              {[
                { n:1, icon:'⬇️', text:`Click "Download Installer" — ${info.fileName || 'ReelsPro-Setup.exe'} download hogi` },
                { n:2, icon:'🛑', text:'Pehle app band karo (close karo)' },
                { n:3, icon:'📂', text:'Downloaded .exe file run karo' },
                { n:4, icon:'✅', text:'Install ho jayega — naya version start karo' },
              ].map(s => (
                <div key={s.n} style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:8 }}>
                  <span style={{
                    minWidth:22, height:22, borderRadius:'50%',
                    background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:11, fontWeight:800, color:'#fff', flexShrink:0,
                  }}>{s.n}</span>
                  <span style={{ fontSize:13, color:'#94a3b8', lineHeight:1.5 }}>
                    {s.icon} {s.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Download button */}
            {!downloaded ? (
              <button
                onClick={handleDownload}
                disabled={downloading}
                style={{
                  width:'100%', padding:'15px 0', borderRadius:12, border:'none',
                  background: downloading
                    ? 'rgba(99,102,241,0.5)'
                    : 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#a855f7 100%)',
                  color:'#fff', fontWeight:800, fontSize:16,
                  cursor: downloading ? 'wait' : 'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                  boxShadow: downloading ? 'none' : '0 8px 32px rgba(99,102,241,0.5)',
                  transition:'all 0.2s',
                }}>
                {downloading ? (
                  <>
                    <span style={{ animation:'rp_spin 1s linear infinite', display:'inline-block' }}>⟳</span>
                    Opening Download...
                  </>
                ) : (
                  <>⬇️ Download Installer ({info.fileName || 'ReelsPro-Setup.exe'})</>
                )}
              </button>
            ) : (
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:48, marginBottom:8 }}>✅</div>
                <p style={{ color:'#4ade80', fontWeight:700, fontSize:16, margin:'0 0 4px' }}>
                  Download Started!
                </p>
                <p style={{ color:'#64748b', fontSize:13, margin:'0 0 20px' }}>
                  File download ho rahi hai. Upar diye steps follow karo.
                </p>
                {!info.forceUpdate ? (
                  <button
                    onClick={() => { setShowModal(false); dismiss(); }}
                    style={{
                      padding:'12px 32px', borderRadius:10, border:'none',
                      background:'rgba(99,102,241,0.15)',
                      border:'1px solid rgba(99,102,241,0.3)',
                      color:'#a5b4fc', fontWeight:700, fontSize:14, cursor:'pointer',
                    }}>
                    Close
                  </button>
                ) : (
                  <p style={{ color:'#ef4444', fontSize:13, fontWeight:600, marginTop:10 }}>
                    ⚠️ Please close this app and run the installer to complete the update.
                  </p>
                )}
              </div>
            )}

            {/* Release notes link */}
            {info.releaseUrl && !downloaded && (
              <p style={{ textAlign:'center', marginTop:14, fontSize:12, color:'#475569' }}>
                <a href={info.releaseUrl} target="_blank" rel="noreferrer"
                  style={{ color:'#6366f1', textDecoration:'none' }}>
                  View full release notes on GitHub ↗
                </a>
              </p>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes rp_spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
