// ==============================================
// ANALYTICS ROUTES - FINSARTHI
// ==============================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getDashboard,
  getMonthlyTrends,
  getInsights
} = require('../controllers/analyticsController');

// Dashboard analytics
router.get('/dashboard', protect, getDashboard);

// Monthly trends
router.get('/trends', protect, getMonthlyTrends);

// Spending insights
router.get('/insights', protect, getInsights);

module.exports = router;