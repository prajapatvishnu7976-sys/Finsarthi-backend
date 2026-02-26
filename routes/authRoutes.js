// ==============================================
// AUTH ROUTES
// ==============================================

const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  refreshToken,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  updatePassword,
  googleCallback
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const {
  registerValidation,
  loginValidation,
  validate
} = require('../middleware/validationMiddleware');

const passport = require('passport');

// ==============================================
// PUBLIC ROUTES
// ==============================================

// @route   POST /api/auth/register
router.post('/register', authLimiter, registerValidation, validate, register);

// @route   POST /api/auth/login
router.post('/login', authLimiter, loginValidation, validate, login);

// @route   POST /api/auth/refresh
router.post('/refresh', refreshToken);

// @route   POST /api/auth/verify-email
router.post('/verify-email', verifyEmail);

// @route   POST /api/auth/forgot-password
router.post('/forgot-password', passwordResetLimiter, forgotPassword);

// @route   POST /api/auth/reset-password/:token
router.post('/reset-password/:token', passwordResetLimiter, resetPassword);

// ==============================================
// GOOGLE OAUTH ROUTES
// ==============================================

// @route   GET /api/auth/google
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false
  })
);

// @route   GET /api/auth/google/callback
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL}/login`,
    session: false
  }),
  googleCallback
);

// ==============================================
// PROTECTED ROUTES
// ==============================================

// @route   GET /api/auth/me
router.get('/me', protect, getMe);

// @route   POST /api/auth/logout
router.post('/logout', protect, logout);

// @route   POST /api/auth/resend-verification
router.post('/resend-verification', protect, resendVerification);

// @route   PUT /api/auth/update-password
router.put('/update-password', protect, updatePassword);

module.exports = router;