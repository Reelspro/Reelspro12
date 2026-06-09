import React, { useEffect, useState } from 'react';
import useReelStore from '../../store/reelStore';
import toast from 'react-hot-toast';

export default function SMJobs() {
  const { reels, fetchReels, downloadReel, deleteReel, isLoading } = useReelStore();
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchReels();
    // Auto refresh every 5 seconds for processing jobs
    const interval = setInterval(() => {
      fetchReels();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchReels]);

  const jobs = reels.filter(r => {
    if (filter === 'completed') return r.status === 'completed';
    if (filter === 'processing') return r.status !== 'completed' && r.status !== 'failed';
    return true;
  });

  const handleCopyLink = (url) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div style={{ padding: 28, height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Generated Videos</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setFilter('processing')} style={{ padding: '8px 14px', borderRadius: 8, border: filter==='processing' ? '1px solid #7c3aed' : '1px solid #2a2a3e', background: filter==='processing' ? '#1a0a2e' : '#1a1a2e', color: filter==='processing' ? '#a78bfa' : '#aaa', fontSize: 12, cursor: 'pointer' }}>Running</button>
          <button onClick={() => setFilter('completed')} style={{ padding: '8px 14px', borderRadius: 8, border: filter==='completed' ? '1px solid #4ade80' : '1px solid #2a2a3e', background: filter==='completed' ? '#052e16' : '#1a1a2e', color: filter==='completed' ? '#4ade80' : '#aaa', fontSize: 12, cursor: 'pointer' }}>Finished</button>
          <button onClick={() => setFilter('all')} style={{ padding: '8px 14px', borderRadius: 8, border: filter==='all' ? '1px solid #ccc' : '1px solid #2a2a3e', background: filter==='all' ? '#2a2a3e' : '#1a1a2e', color: filter==='all' ? '#fff' : '#aaa', fontSize: 12, cursor: 'pointer' }}>All Jobs</button>
          <button onClick={fetchReels} style={{ padding: '8px', borderRadius: 8, border: '1px solid #2a2a3e', background: '#1a1a2e', color: '#aaa', fontSize: 12, cursor: 'pointer' }}>⟳</button>
        </div>
      </div>
      
      {isLoading && jobs.length === 0 && (
        <div style={{ color: '#555', textAlign: 'center', paddingTop: 60 }}><div style={{ fontSize: 24, marginBottom: 12 }}>⏳</div>Loading videos...</div>
      )}
      
      {!isLoading && jobs.length === 0 && (
        <div style={{ color: '#555', textAlign: 'center', paddingTop: 60 }}><div style={{ fontSize: 40, marginBottom: 12 }}>⚙️</div>No videos found.</div>
      )}
      
      {jobs.map(j => {
        const isDone = j.status === 'completed';
        const isFailed = j.status === 'failed';
        const progress = Math.max(0, Math.min(100, j.render_progress || 0));
        
        return (
          <div key={j.id} style={{ background: '#0d0d18', border: '1px solid #1e1e2e', borderRadius: 14, padding: '16px 18px', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 48, height: 48, background: '#1a1a2e', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {j.article_image ? <img src={j.article_image} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <span style={{fontSize: 20}}>🎬</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{j.article_title || 'Custom Story Video'}</div>
                <div style={{ fontSize: 11, color: isDone ? '#4ade80' : isFailed ? '#f87171' : '#a78bfa' }}>
                  {isDone ? '✅ Completed' : isFailed ? '❌ Failed' : `Processing (${progress}%)`}
                  <span style={{ color: '#666', marginLeft: 8 }}>· {new Date(j.created_at).toLocaleString()}</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {j.full_short_url && (
                  <button onClick={() => handleCopyLink(j.full_short_url)} style={{ background: '#1a1a2e', border: '1px solid #2a2a3e', color: '#38bdf8', fontSize: 12, cursor: 'pointer', borderRadius: 8, padding: '6px 10px', fontWeight: 600 }}>
                    🔗 Copy Link
                  </button>
                )}
                
                {isDone && (
                  <button onClick={() => downloadReel(j.id)} style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer', borderRadius: 8, padding: '6px 12px', fontWeight: 700 }}>
                    📥 Download
                  </button>
                )}

                <button onClick={() => { if(window.confirm('Delete this video reel?')) deleteReel(j.id); }} style={{ background: '#1c0e0e', border: '1px solid #4a1d1d', color: '#f87171', fontSize: 12, cursor: 'pointer', borderRadius: 8, padding: '6px 10px', fontWeight: 600 }} title="Delete Reel">
                  🗑️ Del
                </button>
              </div>
            </div>
            
            {!isDone && !isFailed && (
              <div style={{ background: '#1a1a2e', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#7c3aed,#ec4899)', borderRadius: 99, transition: 'width 0.4s' }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
