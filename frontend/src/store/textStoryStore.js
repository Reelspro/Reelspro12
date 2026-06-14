import { create } from 'zustand';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const useTextStoryStore = create((set, get) => ({
  storyText: '',
  username: 'Sarah Storyteller',
  avatarUrl: null,
  voice: 'Jenny',          // voice narration name (Jenny, Aria, Guy, Michelle, none)

  // Selected styles
  background: null,        // { name, color, pattern, text }
  accentColor: null,       // { name, hex }
  animationStyle: '',      // string
  musicTrack: null,        // { name, bpm, emotion }
  sfx: [],                 // string[]

  // Meta options from backend
  availableStyles: {
    backgrounds: [],
    accentColors: [],
    animations: [],
    musicTracks: [],
    sfxOptions: []
  },

  // Generated preview screens
  screens: [],
  isLoading: false,
  isGenerating: false,

  setStoryText: (text) => set({ storyText: text }),
  setUsername: (name) => set({ username: name }),
  setAvatarUrl: (url) => set({ avatarUrl: url }),

  // Manual style overrides
  setBackground: (bg) => set({ background: bg }),
  setAccentColor: (color) => set({ accentColor: color }),
  setAnimation: (anim) => set({ animationStyle: anim }),
  setMusic: (track) => set({ musicTrack: track }),
  setSfx: (sfxList) => set({ sfx: sfxList }),
  setVoice: (v) => set({ voice: v }),

  // Re-roll all options randomly from available selections
  randomizeAll: () => {
    const { availableStyles } = get();
    if (!availableStyles.backgrounds.length) return;

    const bg = availableStyles.backgrounds[Math.floor(Math.random() * availableStyles.backgrounds.length)];
    const accent = availableStyles.accentColors[Math.floor(Math.random() * availableStyles.accentColors.length)];
    const anim = availableStyles.animations[Math.floor(Math.random() * availableStyles.animations.length)].name;
    const music = availableStyles.musicTracks[Math.floor(Math.random() * availableStyles.musicTracks.length)];
    
    // Pick 1-2 random SFX
    const sfxCount = Math.floor(Math.random() * 2) + 1;
    const shuffledSfx = [...availableStyles.sfxOptions].sort(() => 0.5 - Math.random());
    const selectedSfx = shuffledSfx.slice(0, sfxCount).map(s => s.name);

    set({
      background: bg,
      accentColor: accent,
      animationStyle: anim,
      musicTrack: music,
      sfx: selectedSfx
    });
  },

  fetchStyles: async () => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/reels/text-story/styles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        const { backgrounds, accentColors, animations, musicTracks, sfxOptions } = response.data;
        set({
          availableStyles: { backgrounds, accentColors, animations, musicTracks, sfxOptions },
          isLoading: false
        });
        
        // Pick initial random styles if not already set
        if (!get().background) {
          get().randomizeAll();
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
      toast.error('Failed to fetch text story styles');
    }
  },

  previewStory: async () => {
    const { storyText, username, avatarUrl } = get();
    if (!storyText.trim()) return;

    set({ isLoading: true });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/reels/text-story/preview`, 
        { storyText, username, avatarUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data && response.data.success) {
        const { textStory } = response.data;
        set({
          screens: textStory.screens,
          // Sync styles returned from backend if user didn't override manually
          background: get().background || textStory.background,
          accentColor: get().accentColor || textStory.accentColor,
          animationStyle: get().animationStyle || textStory.animationStyle,
          musicTrack: get().musicTrack || textStory.musicTrack,
          sfx: get().sfx.length ? get().sfx : textStory.sfx,
          isLoading: false
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
      toast.error('Failed to fetch live preview');
    }
  },

  generateStory: async () => {
    const { storyText, username, avatarUrl, background, accentColor, animationStyle, musicTrack, sfx, voice } = get();
    if (!storyText.trim()) {
      toast.error('Story text cannot be empty');
      return null;
    }

    set({ isGenerating: true });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/reels/text-story/generate`, 
        { 
          storyText, 
          username, 
          avatarUrl,
          // Send current style selections
          theme: 'text_story',
          voice: voice || 'Jenny',
          customization: {
            textStory: {
              storyText,
              username,
              avatarUrl,
              background,
              accentColor,
              animationStyle,
              musicTrack,
              sfx,
              voice: voice || 'Jenny'
            }
          }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data && response.data.success) {
        toast.success('Text Story Reel started rendering!');
        set({ isGenerating: false });
        return response.data.reelId;
      } else {
        set({ isGenerating: false });
        toast.error(response.data.error || 'Failed to generate reel');
        return null;
      }
    } catch (error) {
      set({ isGenerating: false });
      toast.error(error.response?.data?.error || 'Failed to submit render job');
      return null;
    }
  }
}));

export default useTextStoryStore;
