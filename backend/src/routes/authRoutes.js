const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  getPendingUsers,
  updateUserStatus
} = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

const { authLimiter } = require('../middleware/securityMiddleware');

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.get('/profile', protect, getUserProfile);

// Admin routes
router.get('/admin/pending', protect, admin, getPendingUsers);
router.put('/admin/users/:id/status', protect, admin, updateUserStatus);

module.exports = router;
