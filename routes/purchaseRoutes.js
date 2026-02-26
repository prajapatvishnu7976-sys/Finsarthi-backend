const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  analyzePurchase,
  getHealthScore
} = require('../controllers/purchaseAdvisorController');

router.post('/purchase-check', protect, analyzePurchase);
router.get('/health-score', protect, getHealthScore);

module.exports = router;