const express = require('express');
const router = express.Router();
const { handleRedirect } = require('../controllers/redirectController');

router.get('/:shortToken', handleRedirect);

module.exports = router;
