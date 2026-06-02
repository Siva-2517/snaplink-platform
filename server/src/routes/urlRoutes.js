const express = require('express');
const router = express.Router();
const {
  shortenURL,
  getUserURLs,
  editURL,
  deleteURL,
  generateQRCode
} = require('../controllers/urlController');
const { getURLAnalytics, getGlobalRecentVisits } = require('../controllers/analyticsController');
const { bulkShortenURLs } = require('../controllers/bulkController');
const { protect } = require('../middleware/auth');
const { urlLimiter } = require('../middleware/rateLimiter');
const { validateURLInput } = require('../middleware/validate');

// All URL operations are protected by JWT session authentication
router.use(protect);

router.post('/', urlLimiter, validateURLInput, shortenURL);
router.post('/bulk', urlLimiter, bulkShortenURLs);
router.get('/', getUserURLs);
router.put('/:id', urlLimiter, validateURLInput, editURL);
router.delete('/:id', deleteURL);

router.get('/:id/qrcode', generateQRCode);
router.get('/analytics/recent', getGlobalRecentVisits);
router.get('/:id/analytics', getURLAnalytics);

module.exports = router;
