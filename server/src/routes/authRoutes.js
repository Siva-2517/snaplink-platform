const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  validateVerifyOtpInput,
  validateResendOtpInput,
  validateForgotPasswordInput,
  validateResetPasswordInput,
  validateUpdateUsernameInput,
  validateUpdatePasswordInput
} = require('../middleware/validate');

router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.post('/verify-otp', authLimiter, validateVerifyOtpInput, verifyOtp);
router.post('/resend-otp', authLimiter, validateResendOtpInput, resendOtp);
router.post('/forgot-password', authLimiter, validateForgotPasswordInput, forgotPassword);
router.post('/reset-password', authLimiter, validateResetPasswordInput, resetPassword);
router.post('/google', authLimiter, googleLogin);
router.get('/me', protect, getMe);
router.put('/update-username', protect, authLimiter, validateUpdateUsernameInput, updateUsername);
router.put('/update-password', protect, authLimiter, validateUpdatePasswordInput, updatePassword);

module.exports = router;
