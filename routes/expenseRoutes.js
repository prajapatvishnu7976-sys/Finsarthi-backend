// ==============================================
// EXPENSE ROUTES
// ==============================================

const express = require('express');
const router = express.Router();
const {
  addExpense,
  getExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats
} = require('../controllers/expenseController');

const { protect } = require('../middleware/authMiddleware');
const {
  expenseValidation,
  expenseUpdateValidation,
  mongoIdValidation,
  dateRangeValidation,
  paginationValidation,
  validate
} = require('../middleware/validationMiddleware');

// ==============================================
// ALL ROUTES ARE PROTECTED
// ==============================================

router.use(protect);

// ==============================================
// EXPENSE CRUD ROUTES
// ==============================================

// @route   POST /api/expenses
router.post('/', expenseValidation, validate, addExpense);

// @route   GET /api/expenses
router.get(
  '/',
  dateRangeValidation,
  paginationValidation,
  validate,
  getExpenses
);

// @route   GET /api/expenses/stats
router.get('/stats', dateRangeValidation, validate, getExpenseStats);

// @route   GET /api/expenses/:id
router.get('/:id', mongoIdValidation, validate, getExpense);

// @route   PUT /api/expenses/:id
router.put(
  '/:id',
  mongoIdValidation,
  expenseUpdateValidation,
  validate,
  updateExpense
);

// @route   DELETE /api/expenses/:id
router.delete('/:id', mongoIdValidation, validate, deleteExpense);

module.exports = router;