const ShortURL = require('../models/ShortURL');
const cacheManager = require('../utils/cache');

// Alphanumeric code generator (same as urlController)
const generateUniqueShortCode = async () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let isUnique = false;
  let code = '';

  while (!isUnique) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existing = await ShortURL.findOne({ shortCode: code });
    if (!existing) {
      isUnique = true;
    }
  }

  return code;
};

// Generate a friendly title from URL domain
const generateFriendlyTitle = (urlStr) => {
  try {
    const parsed = new URL(urlStr);
    let host = parsed.hostname.replace('www.', '');
    return host.charAt(0).toUpperCase() + host.slice(1) + ' Redirect';
  } catch (error) {
    return 'Shortened Link';
  }
};

// Validate that a string is a proper HTTP(S) URL
const isValidHttpUrl = (str) => {
  if (!/^https?:\/\//i.test(str)) return false;
  try {
    const parsed = new URL(str);
    return !!parsed.hostname;
  } catch {
    return false;
  }
};

// Parse CSV text into rows of URLs
// Supports formats:
//   1. One URL per line
//   2. CSV with header row (auto-detects column containing URLs)
const parseCSVContent = (text) => {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) return [];

  // Try to detect if first row is a header
  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('url') || firstLine.includes('link') || firstLine.includes('destination');

  const dataLines = hasHeader ? lines.slice(1) : lines;
  const results = [];

  for (const line of dataLines) {
    // Split by comma to handle CSV columns
    const columns = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));

    // Find the first column that looks like a valid URL
    let url = null;
    let alias = null;
    let title = null;

    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      if (!url && isValidHttpUrl(col)) {
        url = col;
      } else if (url && !alias && /^[a-zA-Z0-9_-]{3,25}$/.test(col)) {
        alias = col;
      } else if (url && !title && col.length > 0 && col.length <= 100) {
        title = col;
      }
    }

    // If no URL found in columns, try the entire line as a URL
    if (!url && isValidHttpUrl(line)) {
      url = line;
    }

    if (url) {
      results.push({ longUrl: url, customAlias: alias || undefined, title: title || undefined });
    }
  }

  return results;
};


// @desc    Bulk shorten URLs from CSV content
// @route   POST /api/urls/bulk
// @access  Private
const bulkShortenURLs = async (req, res) => {
  try {
    const { csvContent } = req.body;
    const userId = req.user._id;

    if (!csvContent || typeof csvContent !== 'string' || csvContent.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'CSV content is required. Paste your CSV data containing URLs.'
      });
    }

    // Parse the CSV
    const parsedRows = parseCSVContent(csvContent);

    if (parsedRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid URLs found in the CSV content. Ensure each row contains a valid http:// or https:// URL.'
      });
    }

    // Cap at 50 URLs per batch to prevent abuse
    const MAX_BATCH = 50;
    if (parsedRows.length > MAX_BATCH) {
      return res.status(400).json({
        success: false,
        message: `Too many URLs. Maximum ${MAX_BATCH} URLs per batch. Found: ${parsedRows.length}`
      });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      try {
        let shortCode;

        // Handle custom alias if provided
        if (row.customAlias) {
          const conflict = await ShortURL.findOne({
            $or: [
              { shortCode: row.customAlias },
              { customAlias: row.customAlias }
            ]
          });
          if (conflict) {
            errors.push({
              row: i + 1,
              url: row.longUrl,
              error: `Custom alias "${row.customAlias}" is already taken.`
            });
            continue;
          }
          shortCode = row.customAlias;
        } else {
          shortCode = await generateUniqueShortCode();
        }

        const friendlyTitle = row.title || generateFriendlyTitle(row.longUrl);

        const newUrl = await ShortURL.create({
          user: userId,
          longUrl: row.longUrl,
          shortCode: shortCode,
          customAlias: row.customAlias || undefined,
          title: friendlyTitle
        });

        // Prime the cache
        const cacheValue = {
          id: newUrl._id.toString(),
          longUrl: newUrl.longUrl,
          expiresAt: null,
          isDeleted: false
        };
        await cacheManager.set(`url:${shortCode}`, cacheValue, 3600);

        results.push(newUrl);
      } catch (err) {
        errors.push({
          row: i + 1,
          url: row.longUrl,
          error: err.message || 'Unknown error creating short URL.'
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: `Bulk operation complete. ${results.length} URLs shortened successfully${errors.length > 0 ? `, ${errors.length} failed` : ''}.`,
      urls: results,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: parsedRows.length,
        created: results.length,
        failed: errors.length
      }
    });
  } catch (error) {
    console.error('Bulk Shorten Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during bulk URL shortening.' });
  }
};

module.exports = { bulkShortenURLs };
