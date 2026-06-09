const express = require('express');
const router = express.Router();
const { 
  getChartsData, 
  getClickFeed, 
  getTopReels, 
  getTopCategories,
  getGrowthStats,
  getEngagementOverview
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/charts', protect, getChartsData);
router.get('/feed', protect, getClickFeed);
router.get('/top-reels', protect, getTopReels);
router.get('/top-categories', protect, getTopCategories);
router.get('/growth', protect, getGrowthStats);
router.get('/engagement', protect, getEngagementOverview);

module.exports = router;
