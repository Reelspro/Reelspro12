const db = require('../config/db');
const {
  scrapingQueue,
  renderingQueue,
  imageProcessingQueue,
  analyticsQueue,
  retriesQueue,
} = require('../config/queues');

// @desc    Get global system overview
// @route   GET /api/admin/overview
// @access  Private/Admin
const getSystemOverview = (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const activeUsers = db.prepare(`SELECT COUNT(*) as count FROM users WHERE status = 'approved'`).get().count;
    const totalReels = db.prepare('SELECT COUNT(*) as count FROM reels').get().count;
    const totalClicks = db.prepare('SELECT COUNT(*) as count FROM clicks').get().count;
    const totalDownloads = db.prepare('SELECT COALESCE(SUM(reel_downloads), 0) as count FROM users').get().count;
    const totalCampaigns = db.prepare(`SELECT COUNT(*) as count FROM reels WHERE short_url IS NOT NULL`).get().count;
    const activeApis = db.prepare('SELECT COUNT(*) as count FROM api_keys').get().count;

    const recentUsers = db.prepare('SELECT id, name, email, status, created_at FROM users ORDER BY created_at DESC LIMIT 5').all();
    const topUsers = db.prepare('SELECT name, reels_generated, clicks FROM users ORDER BY reels_generated DESC LIMIT 5').all();

    res.json({
      totals: {
        users: totalUsers,
        activeUsers,
        reels: totalReels,
        clicks: totalClicks,
        downloads: totalDownloads,
        campaigns: totalCampaigns,
        apis: activeApis,
      },
      recentUsers,
      topUsers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch admin overview' });
  }
};

// @desc    Get advanced global analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAdvancedAnalytics = (req, res) => {
  try {
    const topReels = db.prepare(`
      SELECT r.id, r.short_url, a.title as article_title, COUNT(c.id) as total_clicks
      FROM reels r
      JOIN articles a ON r.article_id = a.id
      LEFT JOIN clicks c ON c.reel_id = r.id
      GROUP BY r.id
      ORDER BY total_clicks DESC
      LIMIT 10
    `).all();

    const topCategories = db.prepare(`
      SELECT a.source_category as category, COUNT(DISTINCT r.id) as reels_count, COUNT(c.id) as total_clicks
      FROM reels r
      JOIN articles a ON r.article_id = a.id
      LEFT JOIN clicks c ON c.reel_id = r.id
      GROUP BY a.source_category
      ORDER BY total_clicks DESC
      LIMIT 10
    `).all();

    const topWebsites = db.prepare(`
      SELECT ws.url, ws.category_name, COUNT(DISTINCT a.id) as article_count, COUNT(c.id) as total_clicks
      FROM website_sources ws
      LEFT JOIN articles a ON a.website_source_id = ws.id
      LEFT JOIN reels r ON r.article_id = a.id
      LEFT JOIN clicks c ON c.reel_id = r.id
      GROUP BY ws.id
      ORDER BY total_clicks DESC
      LIMIT 10
    `).all();

    const topTrafficSources = db.prepare(`
      SELECT platform, COUNT(*) as count
      FROM clicks
      GROUP BY platform
      ORDER BY count DESC
    `).all();

    const clicksOverTime = db.prepare(`
      SELECT date(created_at) as date, COUNT(*) as count
      FROM clicks
      GROUP BY date(created_at)
      ORDER BY date DESC
      LIMIT 14
    `).all().reverse();

    res.json({
      topReels,
      topCategories,
      topWebsites,
      topTrafficSources,
      clicksOverTime,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch advanced analytics' });
  }
};

// @desc    Export analytics as JSON
// @route   GET /api/admin/analytics/export
// @access  Private/Admin
const exportAnalytics = (req, res) => {
  try {
    const overview = {
      users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
      activeUsers: db.prepare(`SELECT COUNT(*) as count FROM users WHERE status = 'approved'`).get().count,
      reels: db.prepare('SELECT COUNT(*) as count FROM reels').get().count,
      clicks: db.prepare('SELECT COUNT(*) as count FROM clicks').get().count,
      downloads: db.prepare('SELECT COALESCE(SUM(reel_downloads), 0) as count FROM users').get().count,
      campaigns: db.prepare(`SELECT COUNT(*) as count FROM reels WHERE short_url IS NOT NULL`).get().count,
    };

    const topUsers = db.prepare('SELECT name, email, reels_generated, clicks, campaigns FROM users ORDER BY clicks DESC LIMIT 20').all();
    const recentClicks = db.prepare(`
      SELECT c.*, u.name as user_name, u.email as user_email, a.title as article_title
      FROM clicks c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN reels r ON c.reel_id = r.id
      LEFT JOIN articles a ON r.article_id = a.id
      ORDER BY c.created_at DESC
      LIMIT 100
    `).all();

    res.setHeader('Content-Disposition', 'attachment; filename=reelspro-analytics-export.json');
    res.json({
      exportedAt: new Date().toISOString(),
      overview,
      topUsers,
      recentClicks,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to export analytics' });
  }
};

// @desc    Get BullMQ queue stats
// @route   GET /api/admin/queues
// @access  Private/Admin
const getQueueStats = async (req, res) => {
  try {
    const queues = [
      { name: 'Scraping', queue: scrapingQueue },
      { name: 'Rendering', queue: renderingQueue },
      { name: 'Image Processing', queue: imageProcessingQueue },
      { name: 'Analytics', queue: analyticsQueue },
      { name: 'Retries', queue: retriesQueue },
    ];

    const stats = await Promise.all(
      queues.map(async ({ name, queue }) => {
        const counts = await queue.getJobCounts();
        return { name, ...counts };
      })
    );

    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch queue stats' });
  }
};

// @desc    Get system logs
// @route   GET /api/admin/logs
// @access  Private/Admin
const getSystemLogs = (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const logs = db.prepare(
      'SELECT l.*, u.name as user_name, u.email as user_email FROM activity_logs l LEFT JOIN users u ON l.user_id = u.id ORDER BY l.created_at DESC LIMIT ?'
    ).all(limit);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
};

const fs = require('fs');
const path = require('path');

const getDirSizeRecursive = (dirPath) => {
  let size = 0;
  if (!fs.existsSync(dirPath)) return 0;
  try {
    const files = fs.readdirSync(dirPath);
    for (let i = 0; i < files.length; i++) {
      const filePath = path.join(dirPath, files[i]);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        size += getDirSizeRecursive(filePath);
      } else {
        size += stat.size;
      }
    }
  } catch (e) {
    console.error('Error calculating directory size:', e.message);
  }
  return size;
};

const formatBytesToReadable = (bytes) => {
  if (bytes === 0) return '0 KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// @desc    Get system cache statistics
// @route   GET /api/admin/cache
// @access  Private
const getSystemCache = (req, res) => {
  try {
    const tempDir = path.resolve(__dirname, '../../../output/temp');
    const thumbDir = path.resolve(__dirname, '../../../output/thumbnails');
    
    const tempSize = getDirSizeRecursive(tempDir);
    const thumbSize = getDirSizeRecursive(thumbDir);
    
    const failedJobsCount = db.prepare("SELECT COUNT(*) as count FROM reels WHERE status = 'failed'").get().count;

    const cacheStats = [
      {
        id: 'render_temp',
        badge: 'RENDER CACHE',
        hash: 'Temporary Audio & Render Asset Cache',
        size: formatBytesToReadable(tempSize),
        rawSize: tempSize
      },
      {
        id: 'thumbnails',
        badge: 'THUMBNAILS',
        hash: 'Generated Video Thumbnails',
        size: formatBytesToReadable(thumbSize),
        rawSize: thumbSize
      },
      {
        id: 'failed_logs',
        badge: 'FAILED JOBS',
        hash: `Failed rendering jobs waiting in logs (${failedJobsCount} records)`,
        size: `${failedJobsCount} entries`,
        rawSize: failedJobsCount
      }
    ];

    res.json(cacheStats);
  } catch (error) {
    console.error('[CacheController] getSystemCache error:', error);
    res.status(500).json({ error: 'Failed to fetch cache statistics' });
  }
};

// @desc    Clear specific system cache
// @route   DELETE /api/admin/cache/:id
// @access  Private
const clearSystemCache = (req, res) => {
  try {
    const { id } = req.params;
    
    if (id === 'render_temp' || id === 'all') {
      const tempDir = path.resolve(__dirname, '../../../output/temp');
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        for (const file of files) {
          try {
            const filePath = path.join(tempDir, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
              fs.rmSync(filePath, { recursive: true, force: true });
            } else {
              fs.unlinkSync(filePath);
            }
          } catch (e) {
            console.error(`Failed to delete temp file ${file}:`, e.message);
          }
        }
      }
    }
    
    if (id === 'thumbnails' || id === 'all') {
      const thumbDir = path.resolve(__dirname, '../../../output/thumbnails');
      if (fs.existsSync(thumbDir)) {
        const files = fs.readdirSync(thumbDir);
        for (const file of files) {
          try {
            const filePath = path.join(thumbDir, file);
            fs.unlinkSync(filePath);
          } catch (e) {
            console.error(`Failed to delete thumbnail ${file}:`, e.message);
          }
        }
      }
    }
    
    if (id === 'failed_logs' || id === 'all') {
      // Find all failed reels to delete their records
      const failedReels = db.prepare("SELECT id FROM reels WHERE status = 'failed'").all();
      for (const reel of failedReels) {
        db.prepare('DELETE FROM clicks WHERE reel_id = ?').run(reel.id);
        db.prepare('DELETE FROM render_jobs WHERE reel_id = ?').run(reel.id);
        db.prepare('DELETE FROM reel_scripts WHERE reel_id = ?').run(reel.id);
        db.prepare('DELETE FROM reels WHERE id = ?').run(reel.id);
      }
    }
    
    res.json({ success: true, message: `Cache ${id} cleared successfully` });
  } catch (error) {
    console.error('[CacheController] clearSystemCache error:', error);
    res.status(500).json({ error: 'Failed to clear system cache' });
  }
};

module.exports = {
  getSystemOverview,
  getAdvancedAnalytics,
  exportAnalytics,
  getQueueStats,
  getSystemLogs,
  getSystemCache,
  clearSystemCache,
};
