import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function SMCache() {
  const [cache, setCache] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCache = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/admin/cache`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCache(data);
    } catch (e) {
      toast.error('Failed to load system cache statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCache();
  }, []);

  const handleClearSpecific = async (id) => {
    if (!window.confirm('Are you sure you want to clear this cache category?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/admin/cache/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Cache cleared successfully');
      fetchCache();
    } catch (e) {
      toast.error('Failed to clear selected cache category');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear ALL transient render cache, thumbnails, and failed logs?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/admin/cache/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('All system caches and failed logs purged successfully!');
      fetchCache();
    } catch (e) {
      toast.error('Failed to clear system cache');
    }
  };

  return (
    <div style={{ padding: 28, height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Cache Management</h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>Clear temporary rendering elements and failed logs to free up server space.</p>
        </div>
        {cache.some(c => c.rawSize > 0) && (
          <button 
            onClick={handleClearAll} 
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #4a2a2e', background: '#2a1a1e', color: '#f87171', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
          >
            🗑️ Clear All
          </button>
        )}
      </div>

      {isLoading && cache.length === 0 && (
        <div style={{ color: '#555', textAlign: 'center', paddingTop: 60 }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>⏳</div>Calculating cache size...
        </div>
      )}

      {!isLoading && cache.length === 0 && (
        <div style={{ color: '#555', textAlign: 'center', paddingTop: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💾</div>Cache is completely empty.
        </div>
      )}

      {!isLoading && cache.map(c => {
        const hasData = c.rawSize > 0;
        return (
          <div 
            key={c.id} 
            style={{ 
              background: '#0d0d18', 
              border: '1px solid #1e1e2e', 
              borderRadius: 14, 
              padding: '16px 18px', 
              marginBottom: 10, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12,
              opacity: hasData ? 1 : 0.6
            }}
          >
            <span style={{ 
              background: c.id === 'render_temp' ? '#1e1b4b' : c.id === 'thumbnails' ? '#064e3b' : '#311042', 
              color: c.id === 'render_temp' ? '#a5b4fc' : c.id === 'thumbnails' ? '#6ee7b7' : '#f472b6', 
              fontSize: 10, 
              fontWeight: 700, 
              padding: '4px 10px', 
              borderRadius: 6, 
              letterSpacing: 1 
            }}>
              {c.badge}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#c4b5fd' }}>{c.hash}</div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 3 }}>
                Stored: <span style={{ color: hasData ? '#fff' : '#444', fontWeight: 600 }}>{c.size}</span>
              </div>
            </div>
            {hasData && (
              <button 
                onClick={() => handleClearSpecific(c.id)} 
                style={{ 
                  background: '#221215', 
                  border: '1px solid #6b21a822',
                  color: '#f87171', 
                  fontSize: 14, 
                  cursor: 'pointer', 
                  borderRadius: 8, 
                  padding: '6px 10px',
                  fontWeight: 600,
                  transition: 'background 0.2s'
                }}
                title="Clear Category"
              >
                🗑️ Clear
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
