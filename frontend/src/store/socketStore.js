/**
 * socketStore.js — Phase 20: Real-time Render Progress via Socket.io
 *
 * Connects to backend Socket.io server once user is logged in.
 * Listens for reel_progress, reel_complete, reel_failed events
 * and stores them in Zustand state for the Dashboard to display.
 */

import { create } from 'zustand';
import { io } from 'socket.io-client';
import axios from 'axios';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
  .replace('/api', '');

const useSocketStore = create((set, get) => ({
  socket: null,
  isConnected: false,

  // Map of reelId → { reelId, userId, step, percent, status }
  reelProgress: {},

  /**
   * Connect to Socket.io and join the user's room
   * Call this once after login with the current userId
   */
  connect: (userId, role) => {
    const { socket } = get();
    if (socket?.connected) return; // already connected

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
    });

    newSocket.on('connect', async () => {
      console.log('[Socket] Connected:', newSocket.id);
      // Join personal room for this user
      newSocket.emit('join', userId);
      // If admin, also join admin room
      if (role === 'admin') newSocket.emit('join_admin');
      set({ isConnected: true });

      // Rehydrate active jobs on connect (so they show up if page was reloaded)
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
          const [processingRes, queuedRes] = await Promise.all([
            axios.get(`${API_URL}/reels/my-reels?status=processing&limit=20`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${API_URL}/reels/my-reels?status=queued&limit=20`, { headers: { Authorization: `Bearer ${token}` } })
          ]);
          
          const activeReels = [...processingRes.data, ...queuedRes.data];
          if (activeReels.length > 0) {
            set((state) => {
              const updated = { ...state.reelProgress };
              activeReels.forEach((reel) => {
                if (!updated[reel.id]) {
                  updated[reel.id] = {
                    reelId: reel.id,
                    userId,
                    step: reel.status === 'queued' ? 'In Queue...' : 'Rendering...',
                    percent: reel.render_progress || 0,
                    status: reel.status,
                    updatedAt: Date.now(),
                  };
                }
              });
              return { reelProgress: updated };
            });
          }
        }
      } catch (err) {
        console.error('[Socket] Failed to fetch active jobs:', err.message);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      set({ isConnected: false });
    });

    const handleRenderProgress = (data) => {
      set((state) => ({
        reelProgress: {
          ...state.reelProgress,
          [data.reelId]: {
            ...data,
            percent: data.progress ?? data.percent ?? 0,
            status: 'processing',
            updatedAt: Date.now(),
          },
        },
      }));
    };

    newSocket.on('render_progress', handleRenderProgress);
    newSocket.on('reel_progress', handleRenderProgress);

    const handleRenderComplete = (data) => {
      set((state) => ({
        reelProgress: {
          ...state.reelProgress,
          [data.reelId]: {
            ...state.reelProgress[data.reelId],
            ...data,
            percent: 100,
            step: '✅ Reel ready!',
            status: 'completed',
            updatedAt: Date.now(),
          },
        },
      }));
      setTimeout(() => {
        set((state) => {
          const updated = { ...state.reelProgress };
          delete updated[data.reelId];
          return { reelProgress: updated };
        });
      }, 8000);
    };

    newSocket.on('render_complete', handleRenderComplete);
    newSocket.on('reel_complete', handleRenderComplete);

    const handleRenderFailed = (data) => {
      set((state) => ({
        reelProgress: {
          ...state.reelProgress,
          [data.reelId]: {
            ...data,
            percent: 0,
            step: `❌ Failed: ${data.error || 'Unknown error'}`,
            status: 'failed',
            updatedAt: Date.now(),
          },
        },
      }));
      setTimeout(() => {
        set((state) => {
          const updated = { ...state.reelProgress };
          delete updated[data.reelId];
          return { reelProgress: updated };
        });
      }, 15000);
    };

    newSocket.on('render_failed', handleRenderFailed);
    newSocket.on('reel_failed', handleRenderFailed);

    set({ socket: newSocket });
  },

  /** Disconnect and clean up */
  disconnect: () => {
    const { socket } = get();
    if (socket) socket.disconnect();
    set({ socket: null, isConnected: false, reelProgress: {} });
  },

  /** Manually dismiss a completed/failed job from the panel */
  dismissJob: (reelId) => {
    set((state) => {
      const updated = { ...state.reelProgress };
      delete updated[reelId];
      return { reelProgress: updated };
    });
  }
}));

export default useSocketStore;
