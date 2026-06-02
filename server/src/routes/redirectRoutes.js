const express = require('express');
const router = express.Router();
const ShortURL = require('../models/ShortURL');
const cacheManager = require('../utils/cache');
const analyticsBuffer = require('../utils/buffer');
const { parseUserAgent } = require('../utils/ua');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// @desc    Perform ultra-fast server-side redirect
// @route   GET /:shortCode
// @access  Public
router.get('/:shortCode', async (req, res) => {
  const { shortCode } = req.params;

  try {
    let urlData = null;

    // 1. Try to read from cache first (O(1) lookup)
    const cached = await cacheManager.get(`url:${shortCode}`);
    
    if (cached) {
      urlData = cached;
    } else {
      // 2. Cache Miss: Lookup in MongoDB (Indexed lookup)
      const url = await ShortURL.findOne({
        $or: [
          { shortCode: shortCode },
          { customAlias: shortCode }
        ],
        isDeleted: false
      });

      if (url) {
        // Formulate cache value
        urlData = {
          id: url._id.toString(),
          longUrl: url.longUrl,
          expiresAt: url.expiresAt ? url.expiresAt.getTime() : null,
          isDeleted: false
        };
        // Save to cache (TTL: 1 hour)
        await cacheManager.set(`url:${shortCode}`, urlData, 3600);
      }
    }

    // 3. If URL not found or is flagged as soft-deleted, return a clean custom 404 page
    if (!urlData || urlData.isDeleted) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Link Not Found</title>
          <style>
            body { background: #09090b; color: #f4f4f5; font-family: system-ui, sans-serif; text-align: center; padding: 100px 20px; }
            h1 { color: #f43f5e; font-size: 48px; margin-bottom: 10px; }
            p { color: #a1a1aa; font-size: 18px; }
            a { color: #6366f1; text-decoration: none; font-weight: bold; border: 1px solid #6366f1; padding: 10px 20px; border-radius: 6px; display: inline-block; margin-top: 20px; transition: 0.2s; }
            a:hover { background: #6366f1; color: #fff; box-shadow: 0 0 15px rgba(99, 102, 241, 0.4); }
          </style>
        </head>
        <body>
          <h1>404</h1>
          <h2>Oops! Link Active State Error</h2>
          <p>The shortened link you are trying to visit does not exist or has been disabled.</p>
          <a href="${CLIENT_URL}">Create Your Own URL</a>
        </body>
        </html>
      `);
    }

    // 4. Check for URL Expiration
    if (urlData.expiresAt && urlData.expiresAt < Date.now()) {
      return res.status(410).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Link Expired</title>
          <style>
            body { background: #09090b; color: #f4f4f5; font-family: system-ui, sans-serif; text-align: center; padding: 100px 20px; }
            h1 { color: #f59e0b; font-size: 48px; margin-bottom: 10px; }
            p { color: #a1a1aa; font-size: 18px; }
            a { color: #6366f1; text-decoration: none; font-weight: bold; border: 1px solid #6366f1; padding: 10px 20px; border-radius: 6px; display: inline-block; margin-top: 20px; transition: 0.2s; }
            a:hover { background: #6366f1; color: #fff; box-shadow: 0 0 15px rgba(99, 102, 241, 0.4); }
          </style>
        </head>
        <body>
          <h1>410</h1>
          <h2>This Link Has Expired</h2>
          <p>The expiration date set for this link has passed. It is no longer redirecting visitors.</p>
          <a href="${CLIENT_URL}">Create a New Link</a>
        </body>
        </html>
      `);
    }

    // 5. CRITICAL REDIRECT PATH: Instant Server-Side Redirect (302 Found)
    res.redirect(urlData.longUrl);

    // 6. ASYNC BACKGROUND LOGGING: Log visitor analytics after responding to client
    const visitorInfo = parseUserAgent(req);
    const visitRecord = {
      shortUrl: urlData.id,
      timestamp: new Date(),
      ip: visitorInfo.ip,
      browser: visitorInfo.browser,
      os: visitorInfo.os,
      device: visitorInfo.device,
      country: visitorInfo.country
    };

    // Push into our background queue buffer
    analyticsBuffer.push(visitRecord);

  } catch (error) {
    console.error('Redirection Route Error:', error);
    return res.status(500).send('An unexpected server error occurred.');
  }
});

module.exports = router;
