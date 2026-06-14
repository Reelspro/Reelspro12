import React, { useState, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const BG_OPTIONS = [
  {
    id: 'custom',
    label: 'My Image',
    icon: '🖼️',
    desc: 'Upload your own background image'
  },
  {
    id: 'none',
    label: 'Theme Color',
    icon: '🎨',
    desc: 'Use only theme gradient — no image'
  },
];

export default function BackgroundSelector({ value, onChange }) {
  const [bgType, setBgType] = useState(value?.bgType || 'none');
  const [customImageUrl, setCustomImageUrl] = useState(value?.customImagePath || null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef();

  const handleTypeChange = (type) => {
    setBgType(type);
    if (type !== 'custom') {
      onChange({ bgType: type, customImagePath: null });
    } else {
      onChange({ bgType: type, customImagePath: customImageUrl });
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/upload/background`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setCustomImageUrl(res.data.filePath);
      onChange({ bgType: 'custom', customImagePath: res.data.filePath });
      toast.success('Background image uploaded!');
    } catch (err) {
      console.error(err);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (customImageUrl) {
      const filename = customImageUrl.split('/').pop();
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/upload/background/${filename}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch {}
    }
    setCustomImageUrl(null);
    setPreview(null);
    onChange({ bgType: 'custom', customImagePath: null });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {BG_OPTIONS.map((opt) => {
          const isSelected = bgType === opt.id;
          return (
            <div
              key={opt.id}
              onClick={() => handleTypeChange(opt.id)}
              className={`border rounded-xl p-4 cursor-pointer transition-all ${
                isSelected
                  ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/5'
                  : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{opt.icon}</span>
                <div>
                  <h4 className={`font-semibold text-sm ${isSelected ? 'text-purple-400' : 'text-gray-200'}`}>
                    {opt.label}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {bgType === 'custom' && (
        <div className="border border-gray-800 rounded-xl p-4 bg-gray-950/50 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Custom Background Image
            </span>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
            >
              {uploading ? 'Uploading...' : '📁 Select File'}
            </button>
          </div>

          {preview || customImageUrl ? (
            <div className="relative aspect-[9/16] w-32 mx-auto rounded-lg overflow-hidden border border-gray-800">
              <img
                src={preview || `${API_URL.replace('/api', '')}${customImageUrl}`}
                alt="Background Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-1 right-1 bg-black/70 hover:bg-black/90 text-white rounded-full p-1 transition-colors"
                title="Remove image"
              >
                ✕
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-800 hover:border-gray-700 rounded-lg aspect-[9/16] w-32 mx-auto flex flex-col items-center justify-center cursor-pointer transition-colors p-4"
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500" />
              ) : (
                <>
                  <span className="text-xl mb-1">📤</span>
                  <p className="text-[10px] text-center text-gray-500 font-medium">Click to upload</p>
                  <p className="text-xs text-gray-600 mt-1">JPG, PNG, WEBP — max 10MB</p>
                  <p className="text-xs text-gray-600">Best size: 1080×1920 (9:16 vertical)</p>
                </>
              )}
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      )}

      {/* No background tip */}
      {bgType === 'none' && (
        <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-3">
          <p className="text-xs text-gray-400">
            🎨 Reel will use your selected theme colors as background — clean minimal look
          </p>
        </div>
      )}
    </div>
  );
}
