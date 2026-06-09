const express = require('express');
const router = express.Router();
const {
  getSources,
  addSource,
  updateSource,
  deleteSource
} = require('../controllers/sourceController');
const { protect, admin } = require('../middleware/authMiddleware');

// All source routes are protected and admin-only
router.route('/')
  .get(protect, admin, getSources)
  .post(protect, admin, addSource);

router.route('/:id')
  .put(protect, admin, updateSource)
  .delete(protect, admin, deleteSource);

module.exports = router;
