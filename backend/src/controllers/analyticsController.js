const db = require('../config/db');

// @desc    Get aggregate analytics (charts data)
// @route   GET /api/analytics/charts
// @access  Private
const getChartsData = (req, res) => {
  try {
    const userId = req.user.role === 'admin' ? null : req.user.id;
    
    // 1. Clicks over time (last 7 days)
    const clicksOverTime = userId
      ? db.prepare(`SELECT date(created_at) as date, COUNT(*) as count FROM clicks WHERE user_id = ? GROUP BY date(created_at) ORDER BY date(created_at) DESC LIMIT 7`).all(userId)
      : db.prepare(`SELECT date(created_at) as date, COUNT(*) as count FROM clicks GROUP BY date(created_at) ORDER BY date(created_at) DESC LIMIT 7`).all();

    // 2. Platform breakdown
    const platformData = userId
      ? db.prepare(`SELECT platform, COUNT(*) as count FROM clicks WHERE user_id = ? GROUP BY platform`).all(userId)
      : db.prepare(`SELECT platform, COUNT(*) as count FROM clicks GROUP BY platform`).all();

    // 3. Device breakdown
    const deviceData = userId
      ? db.prepare(`SELECT device, COUNT(*) as count FROM clicks WHERE user_id = ? GROUP BY device`).all(userId)
      : db.prepare(`SELECT device, COUNT(*) as count FROM clicks GROUP BY device`).all();

    // 4. OS breakdown
    const osData = userId
      ? db.prepare(`SELECT os, COUNT(*) as count FROM clicks WHERE user_id = ? GROUP BY os`).all(userId)
      : db.prepare(`SELECT os, COUNT(*) as count FROM clicks GROUP BY os`).all();
    
    // 5. Country breakdown
    const countryData = userId
      ? db.prepare(`SELECT country, COUNT(*) as count FROM clicks WHERE user_id = ? GROUP BY country ORDER BY count DESC LIMIT 5`).all(userId)
      : db.prepare(`SELECT country, COUNT(*) as count FROM clicks GROUP BY country ORDER BY count DESC LIMIT 5`).all();

    res.json({
      clicksOverTime: clicksOverTime.reverse(),
      platformData,
      deviceData,
      osData,
      countryData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
};

// @desc    Get live click feed
// @route   GET /api/analytics/feed
// @access  Private
const getClickFeed = (req, res) => {
  try {
    const userId = req.user.role === 'admin' ? null : req.user.id;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);

    const feed = userId
      ? db.prepare(`
          SELECT c.*, r.short_url, a.title as article_title, a.source_category
          FROM clicks c
          JOIN reels r ON c.reel_id = r.id
          JOIN articles a ON r.article_id = a.id
          WHERE c.user_id = ?
          ORDER BY c.created_at DESC LIMIT ?
        `).all(userId, limit)
      : db.prepare(`
          SELECT c.*, r.short_url, a.title as article_title, a.source_category,
                 u.name as user_name, u.email as user_email
          FROM clicks c
          JOIN reels r ON c.reel_id = r.id
          JOIN articles a ON r.article_id = a.id
          LEFT JOIN users u ON c.user_id = u.id
          ORDER BY c.created_at DESC LIMIT ?
        `).all(limit);

    res.json(feed);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch click feed' });
  }
};

// @desc    Get top reels by clicks
// @route   GET /api/analytics/top-reels
// @access  Private
const getTopReels = (req, res) => {
  try {
    const userId = req.user.role === 'admin' ? null : req.user.id;
    const topReels = userId
      ? db.prepare(`SELECT r.id, r.short_url, r.thumbnail_path, a.title as article_title, COUNT(c.id) as total_clicks FROM reels r JOIN articles a ON r.article_id = a.id LEFT JOIN clicks c ON c.reel_id = r.id WHERE r.user_id = ? GROUP BY r.id ORDER BY total_clicks DESC LIMIT 5`).all(userId)
      : db.prepare(`SELECT r.id, r.short_url, r.thumbnail_path, a.title as article_title, COUNT(c.id) as total_clicks FROM reels r JOIN articles a ON r.article_id = a.id LEFT JOIN clicks c ON c.reel_id = r.id GROUP BY r.id ORDER BY total_clicks DESC LIMIT 5`).all();
    res.json(topReels);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch top reels' });
  }
};

// @desc    Get top categories by usage and clicks
// @route   GET /api/analytics/top-categories
// @access  Private
const getTopCategories = (req, res) => {
  try {
    const userId = req.user.role === 'admin' ? null : req.user.id;
    const topCategories = userId
      ? db.prepare(`SELECT a.source_category as category, COUNT(DISTINCT r.id) as reels_count, COUNT(c.id) as total_clicks FROM reels r JOIN articles a ON r.article_id = a.id LEFT JOIN clicks c ON c.reel_id = r.id WHERE r.user_id = ? GROUP BY a.source_category ORDER BY total_clicks DESC, reels_count DESC LIMIT 5`).all(userId)
      : db.prepare(`SELECT a.source_category as category, COUNT(DISTINCT r.id) as reels_count, COUNT(c.id) as total_clicks FROM reels r JOIN articles a ON r.article_id = a.id LEFT JOIN clicks c ON c.reel_id = r.id GROUP BY a.source_category ORDER BY total_clicks DESC, reels_count DESC LIMIT 5`).all();
    res.json(topCategories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch top categories' });
  }
};

// @desc    Get growth statistics (clicks comparison)
// @route   GET /api/analytics/growth
// @access  Private
const getGrowthStats = (req, res) => {
  try {
    const userId = req.user.role === 'admin' ? null : req.user.id;
    
    // Clicks in last 7 days vs previous 7 days
    const current7 = userId 
      ? db.prepare(`SELECT COUNT(*) as count FROM clicks WHERE user_id = ? AND created_at >= date('now', '-7 days')`).get(userId).count
      : db.prepare(`SELECT COUNT(*) as count FROM clicks WHERE created_at >= date('now', '-7 days')`).get().count;

    const previous7 = userId
      ? db.prepare(`SELECT COUNT(*) as count FROM clicks WHERE user_id = ? AND created_at >= date('now', '-14 days') AND created_at < date('now', '-7 days')`).get(userId).count
      : db.prepare(`SELECT COUNT(*) as count FROM clicks WHERE created_at >= date('now', '-14 days') AND created_at < date('now', '-7 days')`).get().count;

    const growthPercent = previous7 === 0 ? (current7 > 0 ? 100 : 0) : Math.round(((current7 - previous7) / previous7) * 100);

    res.json({
      currentPeriod: current7,
      previousPeriod: previous7,
      growthPercent
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch growth stats' });
  }
};

// @desc    Get engagement overview (avg clicks per reel)
// @route   GET /api/analytics/engagement
// @access  Private
const getEngagementOverview = (req, res) => {
  try {
    const userId = req.user.role === 'admin' ? null : req.user.id;
    
    const stats = userId
      ? db.prepare(`
          SELECT 
            COUNT(DISTINCT r.id) as total_reels,
            COUNT(c.id) as total_clicks,
            CAST(COUNT(c.id) AS FLOAT) / NULLIF(COUNT(DISTINCT r.id), 0) as avg_clicks
          FROM reels r
          LEFT JOIN clicks c ON r.id = c.reel_id
          WHERE r.user_id = ?
        `).get(userId)
      : db.prepare(`
          SELECT 
            COUNT(DISTINCT r.id) as total_reels,
            COUNT(c.id) as total_clicks,
            CAST(COUNT(c.id) AS FLOAT) / NULLIF(COUNT(DISTINCT r.id), 0) as avg_clicks
          FROM reels r
          LEFT JOIN clicks c ON r.id = c.reel_id
        `).get();

    res.json({
      totalReels: stats.total_reels,
      totalClicks: stats.total_clicks,
      avgClicksPerReel: Math.round((stats.avg_clicks || 0) * 10) / 10
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch engagement overview' });
  }
};

module.exports = {
  getChartsData,
  getClickFeed,
  getTopReels,
  getTopCategories,
  getGrowthStats,
  getEngagementOverview
};
