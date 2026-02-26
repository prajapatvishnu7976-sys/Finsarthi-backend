// ==============================================
// USER ROUTES
// ==============================================

const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAccount,
  getFinancialProfile,
  updateFinancialProfile,
  getHealthScore,
  getDashboard
} = require('../controllers/userController');

const { protect, verifiedOnly } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');
const { uploadLimiter } = require('../middleware/rateLimiter');
const {
  financialProfileValidation,
  validate
} = require('../middleware/validationMiddleware');

// ==============================================
// ALL ROUTES ARE PROTECTED
// ==============================================

router.use(protect);

// ==============================================
// USER PROFILE ROUTES
// ==============================================

// @route   GET /api/user/profile
router.get('/profile', getProfile);

// @route   PUT /api/user/profile
router.put('/profile', updateProfile);

// @route   POST /api/user/avatar
router.post('/avatar', uploadLimiter, upload.single('avatar'), uploadAvatar);

// @route   DELETE /api/user/account
router.delete('/account', deleteAccount);

// ==============================================
// FINANCIAL PROFILE ROUTES
// ==============================================

// @route   GET /api/user/financial-profile
router.get('/financial-profile', getFinancialProfile);

// @route   PUT /api/user/financial-profile
router.put(
  '/financial-profile',
  financialProfileValidation,
  validate,
  updateFinancialProfile
);

// @route   GET /api/user/health-score
router.get('/health-score', getHealthScore);

// ==============================================
// DASHBOARD
// ==============================================

// @route   GET /api/user/dashboard
router.get('/dashboard', getDashboard);

module.exports = router;