const express = require('express');
const router = express.Router();
const {
  registerUser,
  verifyOTP,
  loginUser,
  getUserProfile,
  getPendingUsers,
  updateUserStatus,
  updatePassword
} = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

const { authLimiter } = require('../middleware/securityMiddleware');

router.post('/register', authLimiter, registerUser);
router.post('/verify-otp', authLimiter, verifyOTP);
router.post('/login', authLimiter, loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/update-password', protect, updatePassword);

// Admin routes
router.get('/admin/pending', protect, admin, getPendingUsers);
router.put('/admin/users/:id/status', protect, admin, updateUserStatus);

module.exports = router;
