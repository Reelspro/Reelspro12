const app = require('./app');
const runMigrations = require('./database/migrations');
const http = require('http');
const { Server } = require('socket.io');
const emitter = require('./socket/emitter');

let PORT = process.env.PORT || 5000;

// Ensure DB schema is always up to date
runMigrations();

const { scanMusicLibrary } = require('./services/music_engine');
const { backfillArticleContent } = require('./services/articleService');
scanMusicLibrary();
setTimeout(() => backfillArticleContent(40).catch((e) => console.warn('[Startup] Article backfill:', e.message)), 8000);

// Start workers and cron
require('./workers/scrapingWorker');
require('./workers/renderingWorker');
require('./cron/scraperCron');

const { scraperWorker } = require('./workers/scraperWorker');
const { scraperQueue } = require('./config/queues');

// Auto-scrape on startup (5 second delay)
setTimeout(async () => {
  try {
    await scraperQueue.add({ scrapeAll: true }, { jobId: 'startup-scrape' });
    console.log('[Startup] Initial scrape job queued');
  } catch (e) {
    console.warn('[Startup] Could not queue scrape:', e.message);
  }
}, 5000);

// Auto-scrape every 2 hours
const cron = require('node-cron');
cron.schedule('0 */2 * * *', async () => {
  try {
    await scraperQueue.add({ scrapeAll: true });
    console.log('[Cron] Auto-scrape job queued');
  } catch (e) {}
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Export io so controllers can emit events
module.exports.io = io;

// Register io with central emitter (used by workers)
emitter.setIO(io);

io.on('connection', (socket) => {
  console.log('[Socket.io] Client connected:', socket.id);
  
  // Basic room joining for user-specific real-time updates
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`[Socket.io] Client ${socket.id} joined user_${userId}`);
  });

  socket.on('join_admin', () => {
    socket.join('admin');
    console.log(`[Socket.io] Admin ${socket.id} joined admin room`);
  });

  socket.on('disconnect', () => {
    console.log('[Socket.io] Client disconnected:', socket.id);
  });
});

const startServer = (port) => {
  server.listen(port, () => {
    console.log(`Server running on port ${port} with Socket.io`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Startup] Port ${port} is already in use. Trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('[Startup] Server error:', err);
      process.exit(1);
    }
  });
};

startServer(PORT);
