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

const validateVerifyOtpInput = (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Please provide both email and verification code.' });
  }

  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
  }

  const otpRegex = /^\d{6}$/;
  if (!otpRegex.test(otp)) {
    return res.status(400).json({ success: false, message: 'Verification code must be exactly 6 digits.' });
  }

  next();
};

const validateResendOtpInput = (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email address is required.' });
  }

  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
  }

  next();
};

const validateForgotPasswordInput = (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email address is required.' });
  }

  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
  }

  next();
};

const validateResetPasswordInput = (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
  }

  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
  }

  const otpRegex = /^\d{6}$/;
  if (!otpRegex.test(otp)) {
    return res.status(400).json({ success: false, message: 'Verification code must be exactly 6 digits.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  if (!hasLetter || !hasNumber) {
    return res.status(400).json({ success: false, message: 'Password must contain at least one letter and one number.' });
  }

  next();
};

const validateUpdateUsernameInput = (req, res, next) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ success: false, message: 'Username is required.' });
  }

  const trimmedUsername = username.trim();
  if (trimmedUsername.length < 3 || trimmedUsername.length > 25) {
    return res.status(400).json({ success: false, message: 'Username must be between 3 and 25 characters.' });
  }

  const usernameRegex = /^[a-zA-Z0-9-_]+$/;
  if (!usernameRegex.test(trimmedUsername)) {
    return res.status(400).json({
      success: false,
      message: 'Username can only contain letters, numbers, hyphens (-) and underscores (_).'
    });
  }

  req.body.username = trimmedUsername;
  next();
};

const validateUpdatePasswordInput = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Please provide both current and new passwords.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
  }

  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  if (!hasLetter || !hasNumber) {
    return res.status(400).json({ success: false, message: 'New password must contain at least one letter and one number.' });
  }

  next();
};

module.exports = {
  validateURLInput,
  validateVerifyOtpInput,
  validateResendOtpInput,
  validateForgotPasswordInput,
  validateResetPasswordInput,
  validateUpdateUsernameInput,
  validateUpdatePasswordInput
};
