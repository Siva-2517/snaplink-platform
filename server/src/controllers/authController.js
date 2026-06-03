const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../services/emailService');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


// Helper to generate a 6-digit random code
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper to hash OTPs using SHA-256 for secure database storage
const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'developer-glowing-secret-key-for-local-use',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @desc    Register a new user (with verification OTP code)
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username, email, and password.' });
    }

    // Check if user already exists
    const userByEmail = await User.findOne({ email: email.toLowerCase() });
    if (userByEmail) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists.' });
    }

    const userByUsername = await User.findOne({ username });
    if (userByUsername) {
      return res.status(400).json({ success: false, message: 'This username is already taken.' });
    }

    // Generate 6-digit verification code
    const rawOtp = generateOTP();
    const hashedOtp = hashOTP(rawOtp);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // Valid for 10 minutes

    // Create user (hashing is handled pre-save in User model)
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password,
      isVerified: false,
      otp: hashedOtp,
      otpExpires: otpExpiry,
      lastOtpSentAt: new Date()
    });

    // Send OTP verification email in the background
    emailService.sendVerificationOTP(user.email, user.username, rawOtp)
      .catch(err => console.error('Failed to send verification OTP email:', err));

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email for the verification code.',
      email: user.email
    });
  } catch (error) {
    console.error('Signup Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during signup.' });
  }
};

// @desc    Log in a user (requires verified status)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter both email and password.' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.provider === 'google') {
      return res.status(403).json({
        success: false,
        message: 'This account is registered with Google. Please use Google Login.'
      });
    }

    // FEATURE 4: LOGIN PROTECTION
    if (!user.isVerified) {
      return res.status(403).json({ 
        success: false, 
        message: 'Please verify your email before logging in.',
        isVerified: false,
        email: user.email 
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// @desc    Verify email address using the 6-digit OTP code
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'This email is already verified.' });
    }

    // Check if OTP has expired
    if (!user.otpExpires || new Date() > user.otpExpires) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
    }

    // Verify OTP match
    const hashedIncoming = hashOTP(otp);
    if (user.otp !== hashedIncoming) {
      return res.status(400).json({ success: false, message: 'Invalid verification code.' });
    }

    // Update verified status
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Send Welcome Email in the background
    emailService.sendWelcomeEmail(user.email, user.username)
      .catch(err => console.error('Failed to send welcome email:', err));

    // Log the user in automatically after successful verification
    const token = generateToken(user._id);

    return res.json({
      success: true,
      message: 'Email verified successfully! Welcome to SnapLink.',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during verification.' });
  }
};

// @desc    Resend a fresh verification OTP code (limited to 1 per minute)
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'This email is already verified.' });
    }

    // Enforce 60-second limit between code triggers
    const minWaitMs = 60 * 1000;
    if (user.lastOtpSentAt && (new Date() - user.lastOtpSentAt) < minWaitMs) {
      const waitSecondsLeft = Math.ceil((minWaitMs - (new Date() - user.lastOtpSentAt)) / 1000);
      return res.status(429).json({ 
        success: false, 
        message: `Please wait ${waitSecondsLeft} seconds before requesting another code.` 
      });
    }

    // Generate new OTP
    const rawOtp = generateOTP();
    user.otp = hashOTP(rawOtp);
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.lastOtpSentAt = new Date();
    await user.save();

    // Send new OTP email in background
    emailService.sendVerificationOTP(user.email, user.username, rawOtp)
      .catch(err => console.error('Failed to send verification OTP email:', err));

    return res.json({
      success: true,
      message: 'A fresh verification code was sent to your email.'
    });
  } catch (error) {
    console.error('Resend OTP Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during resend.' });
  }
};

// @desc    Request a password reset OTP code
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    
    // To prevent user enumeration exploits, return a generic success message
    // even if the email does not exist in our database.
    if (!user) {
      return res.json({
        success: true,
        message: 'If that email address exists, a password reset code was sent.'
      });
    }

    // Generate reset OTP
    const rawOtp = generateOTP();
    user.resetOtp = hashOTP(rawOtp);
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Send reset OTP email in background
    emailService.sendPasswordResetOTP(user.email, user.username, rawOtp)
      .catch(err => console.error('Failed to send password reset OTP email:', err));

    return res.json({
      success: true,
      message: 'If that email address exists, a password reset code was sent.'
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during password reset request.' });
  }
};

// @desc    Reset password using the reset OTP code
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid password reset request.' });
    }

    // Check if reset OTP has expired
    if (!user.resetOtpExpires || new Date() > user.resetOtpExpires) {
      return res.status(400).json({ success: false, message: 'Reset code has expired. Please request a new one.' });
    }

    // Validate reset OTP match
    const hashedIncoming = hashOTP(otp);
    if (user.resetOtp !== hashedIncoming) {
      return res.status(400).json({ success: false, message: 'Invalid password reset code.' });
    }

    // Set new password (pre-save hook will auto-hash it)
    user.password = newPassword;
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    await user.save();

    // Send Password Changed alert email in background
    emailService.sendPasswordChangedEmail(user.email, user.username)
      .catch(err => console.error('Failed to send password update email:', err));

    return res.json({
      success: true,
      message: 'Your password was updated successfully! You can now log in.'
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during password reset.' });
  }
};

// @desc    Get active authenticated user profile details
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    return res.json({
      success: true,
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email
      }
    });
  } catch (error) {
    console.error('getMe Error:', error);
    return res.status(500).json({ success: false, message: 'Server error loading profile.' });
  }
};

// @desc    Update username
// @route   PUT /api/auth/update-username
// @access  Private
const updateUsername = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || username.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Username must be at least 3 characters.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.username === username) {
      return res.status(400).json({ success: false, message: 'New username must be different from current username.' });
    }

    // Check if new username is already taken
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'This username is already taken.' });
    }

    user.username = username;
    await user.save();

    return res.json({
      success: true,
      message: 'Username updated successfully!',
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Update Username Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during username update.' });
  }
};

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide both current and new passwords.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password.' });
    }

    // Verify new password isn't same as old one
    const isSame = await user.comparePassword(newPassword);
    if (isSame) {
      return res.status(400).json({ success: false, message: 'New password cannot be the same as your current password.' });
    }

    // Update password (pre-save hook hashes it)
    user.password = newPassword;
    await user.save();

    // Send notification email in background
    emailService.sendPasswordChangedEmail(user.email, user.username)
      .catch(err => console.error('Failed to send password update email:', err));

    return res.json({
      success: true,
      message: 'Password updated successfully!'
    });
  } catch (error) {
    console.error('Update Password Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during password update.' });
  }
};

// @desc    Log in / Sign up with Google OAuth
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Google ID token is required.' });
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    } catch (err) {
      console.error('Google token verification failed:', err);
      return res.status(400).json({ success: false, message: 'Invalid Google ID token.' });
    }

    const { email, name, sub } = payload;

    // Find user by email (case-insensitive)
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // If user exists, check if they have googleId set
      if (!user.googleId) {
        user.googleId = sub;
        await user.save();
      }
    } else {
      // Create new Google user
      // Clean name for username (only alphanumeric, dashes, and underscores)
      let baseUsername = name.replace(/[^a-zA-Z0-9-_]/g, '_');
      if (baseUsername.length < 3) {
        baseUsername = 'google_user_' + sub.slice(-5);
      }
      if (baseUsername.length > 20) {
        baseUsername = baseUsername.slice(0, 20);
      }

      let username = baseUsername;
      let suffix = 1;
      // Guarantee unique username
      while (await User.findOne({ username })) {
        username = `${baseUsername.slice(0, 16)}_${suffix}`;
        suffix++;
      }

      user = await User.create({
        username,
        email: email.toLowerCase(),
        provider: 'google',
        googleId: sub,
        isVerified: true // Google emails are pre-verified
      });
    }

    const jwtToken = generateToken(user._id);

    return res.json({
      success: true,
      message: 'Logged in successfully with Google!',
      token: jwtToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during Google Authentication.' });
  }
};

module.exports = {
  signup,
  login,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  getMe,
  updateUsername,
  updatePassword,
  googleLogin
};
