// ==============================================
// BUDGET ROUTES
// ==============================================

const express = require('express');
const router = express.Router();
const {
  setBudget,
  getBudgets,
  getBudget,
  updateBudget,
  deleteBudget,
  getBudgetStatus,
  getBudgetHistory,
  checkBudgetAlerts
} = require('../controllers/budgetController');

const { protect } = require('../middleware/authMiddleware');
const {
  budgetValidation,
  mongoIdValidation,
  validate
} = require('../middleware/validationMiddleware');

// ==============================================
// ALL ROUTES ARE PROTECTED
// ==============================================

router.use(protect);

// ==============================================
// BUDGET ROUTES
// ==============================================

// @route   POST /api/budget
router.post('/', budgetValidation, validate, setBudget);

// @route   GET /api/budget
router.get('/', getBudgets);

// @route   GET /api/budget/status
router.get('/status', getBudgetStatus);

// @route   GET /api/budget/history/:categoryId
router.get('/history/:categoryId', mongoIdValidation, validate, getBudgetHistory);

// @route   POST /api/budget/check-alerts
router.post('/check-alerts', checkBudgetAlerts);

// @route   GET /api/budget/:id
router.get('/:id', mongoIdValidation, validate, getBudget);

// @route   PUT /api/budget/:id
router.put('/:id', mongoIdValidation, validate, updateBudget);

// @route   DELETE /api/budget/:id
router.delete('/:id', mongoIdValidation, validate, deleteBudget);

module.exports = router;