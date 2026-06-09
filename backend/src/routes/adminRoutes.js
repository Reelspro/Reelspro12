const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserDetail,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getSystemSettings,
  updateSystemSettings
} = require('../controllers/authController');

const {
  getSystemOverview,
  getAdvancedAnalytics,
  exportAnalytics,
  getQueueStats,
  getSystemLogs,
  getSystemCache,
  clearSystemCache,
} = require('../controllers/adminController');

const { protect, admin } = require('../middleware/authMiddleware');

// System overview, analytics & logs
router.get('/overview', protect, admin, getSystemOverview);
router.get('/analytics', protect, admin, getAdvancedAnalytics);
router.get('/analytics/export', protect, admin, exportAnalytics);
router.get('/queues', protect, admin, getQueueStats);
router.get('/logs', protect, admin, getSystemLogs);

// System cache management
router.get('/cache', protect, admin, getSystemCache);
router.delete('/cache/:id', protect, admin, clearSystemCache);

// System settings
router.get('/settings', protect, admin, getSystemSettings);
router.put('/settings', protect, admin, updateSystemSettings);

// User management
router.get('/users', protect, admin, getAllUsers);
router.get('/users/:id', protect, admin, getUserDetail);
router.put('/users/:id/status', protect, admin, updateUserStatus);
router.put('/users/:id/role', protect, admin, updateUserRole);
router.delete('/users/:id', protect, admin, deleteUser);

// Manual scrape trigger
router.post('/scrape/all', protect, admin, async (req, res) => {
  try {
    const { scraperQueue } = require('../config/queues');
    await scraperQueue.add({ scrapeAll: true });
    res.json({ success: true, message: 'Scraping all sources started' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/scrape/:sourceId', protect, admin, async (req, res) => {
  try {
    const { scraperQueue } = require('../config/queues');
    await scraperQueue.add({ sourceId: parseInt(req.params.sourceId) });
    res.json({ success: true, message: 'Scraping source ' + req.params.sourceId + ' started' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Articles management
router.get('/articles', protect, admin, (req, res) => {
  try {
    const db = require('../config/db');
    const { page = 1, limit = 20, source_id, search } = req.query;
    const offset = (page - 1) * limit;
    let where = '1=1';
    const params = [];
    if (source_id) { where += ' AND website_source_id = ?'; params.push(source_id); }
    if (search) { where += ' AND title LIKE ?'; params.push('%' + search + '%'); }
    const articles = db.prepare(`
      SELECT id, title, url, source_category, image, usage_count, on_cooldown_until,
             website_source_id, substr(content, 1, 100) as content_preview, created_at
      FROM articles WHERE ${where}
      ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), parseInt(offset));
    const total = db.prepare(`SELECT COUNT(*) as count FROM articles WHERE ${where}`).get(...params).count;
    res.json({ articles, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/articles/:id', protect, admin, (req, res) => {
  try {
    const db = require('../config/db');
    db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
