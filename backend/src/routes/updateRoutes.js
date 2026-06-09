const express = require('express');
const router = express.Router();
const { checkUpdate, applyUpdate, getVersion } = require('../controllers/updateController');
const { protect, admin } = require('../middleware/authMiddleware');

// Any logged-in user can check version
router.get('/version', protect, getVersion);
router.get('/check', protect, checkUpdate);

// Admin only — apply update
router.post('/apply', protect, admin, applyUpdate);

module.exports = router;
