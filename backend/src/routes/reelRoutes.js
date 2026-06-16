const express = require('express');
const router = express.Router();
const {
  generateReel,
  getReelStatus,
  getUserReels,
  downloadReel,
  getUserCampaigns,
  deleteReel,
  getRandomWebsiteArticle,
  getAvailableArticles,
} = require('../controllers/reelController');
const textStoryCtrl = require('../controllers/textStoryController');
const { protect, requireApproved } = require('../middleware/authMiddleware');

const { generationLimiter } = require('../middleware/securityMiddleware');

router.get('/campaigns', protect, requireApproved, getUserCampaigns);
router.get('/my-reels', protect, requireApproved, getUserReels);
router.get('/random-website-article', protect, requireApproved, getRandomWebsiteArticle);
router.get('/available-articles', protect, requireApproved, getAvailableArticles);

router.route('/')
  .get(protect, requireApproved, getUserReels);

router.post('/generate', protect, requireApproved, generationLimiter, generateReel);

// Music library endpoint — list all available background tracks
router.get('/music', (req, res) => {
  try {
    const db = require('../config/db');
    const tracks = db.prepare(`
      SELECT id, filename, category, file_path, duration
      FROM music_library
      ORDER BY category, filename
    `).all();
    res.json(tracks || []);
  } catch (e) {
    console.error('[ReelRoutes] Music fetch error:', e.message);
    res.json([]);
  }
});

// Text Story Generator routes
router.post('/text-story/generate', protect, requireApproved, generationLimiter, textStoryCtrl.generateTextStory);
router.post('/text-story/preview', protect, requireApproved, textStoryCtrl.previewTextStory);
router.get('/text-story/styles', protect, textStoryCtrl.getTextStoryStyles);
router.post('/text-story/ai-rewrite', protect, requireApproved, textStoryCtrl.rewriteStory);

router.get('/:id/status', protect, getReelStatus);
router.get('/:id/download', protect, downloadReel);
router.delete('/:id', protect, requireApproved, deleteReel);

module.exports = router;
