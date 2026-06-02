const ShortURL = require('../models/ShortURL');
const cacheManager = require('../utils/cache');
const QRCode = require('qrcode');

// Alphanumeric code generator (Characters: A-Z, a-z, 0-9)
const generateUniqueShortCode = async () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let isUnique = false;
  let code = '';
  
  while (!isUnique) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Check database collision
    const existing = await ShortURL.findOne({ shortCode: code });
    if (!existing) {
      isUnique = true;
    }
  }
  
  return code;
};

// Friendly fallback title generator based on domain name
const generateFriendlyTitle = (urlStr) => {
  try {
    const parsed = new URL(urlStr);
    let host = parsed.hostname.replace('www.', '');
    // Capitalize first letter
    return host.charAt(0).toUpperCase() + host.slice(1) + ' Redirect';
  } catch (error) {
    return 'Shortened Link';
  }
};

// @desc    Create shortened URL
// @route   POST /api/urls
// @access  Private
const shortenURL = async (req, res) => {
  try {
    const { longUrl, customAlias, expiresAt, title } = req.body;
    const userId = req.user._id;

    let finalShortCode = '';

    // 1. Handle custom alias checks
    if (customAlias) {
      const aliasConflict = await ShortURL.findOne({
        $or: [
          { shortCode: customAlias },
          { customAlias: customAlias }
        ]
      });

      if (aliasConflict) {
        return res.status(400).json({
          success: false,
          message: 'This custom alias or short code is already taken. Please choose another one.'
        });
      }
      finalShortCode = customAlias;
    } else {
      // 2. Generate random unique code
      finalShortCode = await generateUniqueShortCode();
    }

    const friendlyTitle = title && title.trim() ? title.trim() : generateFriendlyTitle(longUrl);

    // 3. Create database entry
    const newUrl = await ShortURL.create({
      user: userId,
      longUrl,
      shortCode: finalShortCode,
      customAlias: customAlias || undefined,
      title: friendlyTitle,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    // 4. Prime the cache instantly so first redirect is sub-millisecond
    const cacheValue = {
      id: newUrl._id.toString(),
      longUrl: newUrl.longUrl,
      expiresAt: newUrl.expiresAt ? newUrl.expiresAt.getTime() : null,
      isDeleted: false
    };
    await cacheManager.set(`url:${finalShortCode}`, cacheValue, 3600); // cache for 1 hour

    return res.status(201).json({
      success: true,
      message: 'URL shortened successfully!',
      url: newUrl
    });
  } catch (error) {
    console.error('Shorten URL Error:', error);
    return res.status(500).json({ success: false, message: 'Server error while shortening URL.' });
  }
};

// @desc    Get user's shortened URLs
// @route   GET /api/urls
// @access  Private
const getUserURLs = async (req, res) => {
  try {
    const urls = await ShortURL.find({
      user: req.user._id,
      isDeleted: false
    }).sort({ createdAt: -1 });

    return res.json({ success: true, urls });
  } catch (error) {
    console.error('GetUserURLs Error:', error);
    return res.status(500).json({ success: false, message: 'Server error loading URLs.' });
  }
};

// @desc    Edit destination / expiration
// @route   PUT /api/urls/:id
// @access  Private
const editURL = async (req, res) => {
  try {
    const { longUrl, title, expiresAt } = req.body;
    const urlId = req.params.id;
    const userId = req.user._id;

    const url = await ShortURL.findOne({ _id: urlId, user: userId, isDeleted: false });

    if (!url) {
      return res.status(404).json({ success: false, message: 'URL not found or unauthorized.' });
    }

    // Capture old code to purge cache
    const oldShortCode = url.shortCode;

    // Update fields
    if (longUrl) url.longUrl = longUrl;
    if (title) url.title = title;
    
    if (expiresAt !== undefined) {
      url.expiresAt = expiresAt ? new Date(expiresAt) : undefined;
    }

    await url.save();

    // Refresh Cache
    const cacheValue = {
      id: url._id.toString(),
      longUrl: url.longUrl,
      expiresAt: url.expiresAt ? url.expiresAt.getTime() : null,
      isDeleted: false
    };
    await cacheManager.set(`url:${oldShortCode}`, cacheValue, 3600);

    return res.json({
      success: true,
      message: 'Short link updated successfully!',
      url
    });
  } catch (error) {
    console.error('Edit URL Error:', error);
    return res.status(500).json({ success: false, message: 'Server error while editing link.' });
  }
};

// @desc    Soft delete short URL
// @route   DELETE /api/urls/:id
// @access  Private
const deleteURL = async (req, res) => {
  try {
    const urlId = req.params.id;
    const userId = req.user._id;

    const url = await ShortURL.findOne({ _id: urlId, user: userId, isDeleted: false });
    
    if (!url) {
      return res.status(404).json({ success: false, message: 'URL not found or unauthorized.' });
    }

    // Toggle soft delete flag
    url.isDeleted = true;
    await url.save();

    // Evict from Cache completely
    await cacheManager.del(`url:${url.shortCode}`);

    return res.json({
      success: true,
      message: 'Short URL deleted successfully! (Analytics retained)'
    });
  } catch (error) {
    console.error('Delete URL Error:', error);
    return res.status(500).json({ success: false, message: 'Server error while deleting link.' });
  }
};

// @desc    Generate QR Code for short URL
// @route   GET /api/urls/:id/qrcode
// @access  Private
const generateQRCode = async (req, res) => {
  try {
    const urlId = req.params.id;
    const userId = req.user._id;

    const url = await ShortURL.findOne({ _id: urlId, user: userId, isDeleted: false });
    if (!url) {
      return res.status(404).json({ success: false, message: 'URL not found or unauthorized.' });
    }

    // Build the short redirection link
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const shortLink = `${baseUrl}/${url.shortCode}`;

    // Generate standard base64 PNG data-url
    const qrDataUrl = await QRCode.toDataURL(shortLink, {
      width: 400,
      margin: 2,
      color: {
        dark: '#4f46e5', // indigo blocks
        light: '#ffffff' // white background
      }
    });

    return res.json({
      success: true,
      qrCode: qrDataUrl
    });
  } catch (error) {
    console.error('QR Code Generation Error:', error);
    return res.status(500).json({ success: false, message: 'Server error generating QR code.' });
  }
};

module.exports = {
  shortenURL,
  getUserURLs,
  editURL,
  deleteURL,
  generateQRCode
};
