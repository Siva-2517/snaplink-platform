const RESERVED_WORDS = new Set([
  'api',
  'auth',
  'login',
  'signup',
  'dashboard',
  'admin',
  'analytics',
  'qrcode',
  'static',
  'assets',
  'users',
  'urls',
  'favicon.ico',
  'robots.txt'
]);

const validateURLInput = (req, res, next) => {
  const { longUrl, customAlias, expiresAt } = req.body;

  // 1. Validate longUrl presence
  if (!longUrl) {
    return res.status(400).json({ success: false, message: 'Destination Long URL is required.' });
  }

  // 2. Validate strict HTTP/HTTPS prefix to prevent javascript: or relative path exploits
  if (!/^https?:\/\//i.test(longUrl)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid URL protocol. The URL must start with http:// or https://'
    });
  }

  // 3. Try to parse using native Node URL constructor to verify absolute structure
  try {
    const parsed = new URL(longUrl);
    if (!parsed.hostname) {
      return res.status(400).json({ success: false, message: 'Invalid URL. Destination must contain a valid domain.' });
    }
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Malformed destination URL structure.' });
  }

  // 4. Validate customAlias if provided
  if (customAlias) {
    const trimmedAlias = customAlias.trim();
    
    // Alphanumeric + hyphens/underscores only
    const aliasRegex = /^[a-zA-Z0-9-_]+$/;
    if (!aliasRegex.test(trimmedAlias)) {
      return res.status(400).json({
        success: false,
        message: 'Custom alias can only contain letters, numbers, hyphens (-) and underscores (_).'
      });
    }

    if (trimmedAlias.length < 3 || trimmedAlias.length > 25) {
      return res.status(400).json({ success: false, message: 'Custom alias must be between 3 and 25 characters.' });
    }

    // Block reserved keywords
    if (RESERVED_WORDS.has(trimmedAlias.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'This custom alias is reserved for system use. Please select a different alias.'
      });
    }

    
    req.body.customAlias = trimmedAlias;
  }

  // 5. Validate optional expiresAt timestamp
  if (expiresAt) {
    const expiryDate = new Date(expiresAt);
    if (isNaN(expiryDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid expiration date format.' });
    }
    if (expiryDate <= new Date()) {
      return res.status(400).json({ success: false, message: 'Expiration date must be in the future.' });
    }
  }

  next();
};

module.exports = { validateURLInput };
