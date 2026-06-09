import React, { useState, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const BG_OPTIONS = [
  {
    id: 'pixabay',
    label: 'Auto (Pixabay)',
    icon: '🔍',
    desc: 'Automatically finds relevant images from Pixabay'
  },
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
  const [bgType, setBgType] = useState(value?.bgType || 'pixabay');
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
      setCustomImageUrl(res.data.imageUrl);
      onChange({ bgType: 'custom', customImagePath: res.data.imageUrl });
      toast.success('Background image uploaded!');
    } catch (e) {
      toast.error('Upload failed: ' + (e.response?.data?.error || e.message));
      setPreview(null);
    }
    setUploading(false);
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
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-300">Background</p>

      {/* 3 option cards */}
      <div className="grid grid-cols-3 gap-2">
        {BG_OPTIONS.map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => handleTypeChange(opt.id)}
            className={`p-3 rounded-xl border text-center transition-all ${
              bgType === opt.id
                ? 'border-purple-500 bg-purple-500/20 text-white'
                : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-500'
            }`}
          >
            <div className="text-2xl mb-1">{opt.icon}</div>
            <div className="text-xs font-medium">{opt.label}</div>
          </button>
        ))}
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500">
        {BG_OPTIONS.find(o => o.id === bgType)?.desc}
      </p>

      {/* Custom upload area */}
      {bgType === 'custom' && (
        <div className="mt-2">
          {preview || customImageUrl ? (
            <div className="relative">
              <img
                src={preview || customImageUrl}
                alt="Background preview"
                className="w-full h-40 object-cover rounded-xl border border-gray-600"
              />
              <button
                onClick={handleRemove}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm"
              >
                ✕
              </button>
              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                ✅ Background set
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-500/5 transition-all"
            >
              {uploading ? (
                <div className="text-purple-400">
                  <div className="animate-spin text-2xl mb-2">⏳</div>
                  <p className="text-sm">Uploading...</p>
                </div>
              ) : (
                <>
                  <div className="text-3xl mb-2">📁</div>
                  <p className="text-sm text-gray-400">Click to upload image</p>
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

      {/* Pixabay tip */}
      {bgType === 'pixabay' && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <p className="text-xs text-blue-400">
            💡 Pixabay will automatically search for images matching your article keywords
          </p>
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
