const express = require('express');
const router = express.Router();
const { getPublicStats } = require('../controllers/publicController');

// Public stats page — no authentication required
router.get('/stats/:shortCode', getPublicStats);

module.exports = router;
