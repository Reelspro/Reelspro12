const express = require('express');
const router = express.Router();
const {
  getApiKeys,
  addApiKey,
  deleteApiKey
} = require('../controllers/apiKeysController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, admin, getApiKeys)
  .post(protect, admin, addApiKey);

router.route('/:id')
  .delete(protect, admin, deleteApiKey);

module.exports = router;
