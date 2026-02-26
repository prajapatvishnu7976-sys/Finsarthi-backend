// ==============================================
// VALIDATION MIDDLEWARE - FIXED
// ==============================================

const { body, param, query, validationResult } = require('express-validator');

// ==============================================
// HANDLE VALIDATION ERRORS
// ==============================================

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

// ==============================================
// AUTH VALIDATIONS
// ==============================================

exports.registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2-50 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),
  
  body('phone')
    .optional()
    .matches(/^[0-9]{10}$/).withMessage('Phone must be a valid 10-digit number')
];

exports.loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
];

// ==============================================
// FINANCIAL PROFILE VALIDATIONS
// ==============================================

exports.financialProfileValidation = [
  body('monthlyIncome')
    .notEmpty().withMessage('Monthly income is required')
    .isFloat({ min: 0 }).withMessage('Monthly income must be a positive number'),
  
  body('fixedExpenses')
    .optional()
    .isFloat({ min: 0 }).withMessage('Fixed expenses must be a positive number'),
  
  body('savingsGoal.amount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Savings goal must be a positive number'),
  
  body('riskAppetite')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('Risk appetite must be low, medium, or high'),
  
  body('debt.totalAmount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Debt amount must be a positive number'),
  
  body('debt.emi')
    .optional()
    .isFloat({ min: 0 }).withMessage('EMI must be a positive number')
];

// ==============================================
// EXPENSE VALIDATIONS - FIXED ✅
// ==============================================

exports.expenseValidation = [
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
  
  // ✅ FIXED: Category is now a string, not ObjectId
  body('category')
    .notEmpty().withMessage('Category is required')
    .isString().withMessage('Category must be a string')
    .isIn([
      'Food & Dining',
      'Transportation',
      'Shopping',
      'Entertainment',
      'Bills & Utilities',
      'Healthcare',
      'Education',
      'Travel',
      'Investments',
      'Salary',
      'Freelance',
      'Business',
      'Rent',
      'EMI',
      'Insurance',
      'Gifts',
      'Other'
    ]).withMessage('Invalid category'),
  
  body('date')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  
  body('type')
    .optional()
    .isIn(['expense', 'income']).withMessage('Type must be expense or income'),
  
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'upi', 'net-banking', 'wallet', 'other'])
    .withMessage('Invalid payment method'),
  
  body('isRecurring')
    .optional()
    .isBoolean().withMessage('isRecurring must be a boolean'),
  
  body('recurringPeriod')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'yearly'])
    .withMessage('Invalid recurring period')
];

exports.expenseUpdateValidation = [
  body('amount')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
  
  // ✅ FIXED: Category validation for update
  body('category')
    .optional()
    .isString().withMessage('Category must be a string')
    .isIn([
      'Food & Dining',
      'Transportation',
      'Shopping',
      'Entertainment',
      'Bills & Utilities',
      'Healthcare',
      'Education',
      'Travel',
      'Investments',
      'Salary',
      'Freelance',
      'Business',
      'Rent',
      'EMI',
      'Insurance',
      'Gifts',
      'Other'
    ]).withMessage('Invalid category'),
  
  body('date')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  
  body('type')
    .optional()
    .isIn(['expense', 'income']).withMessage('Type must be expense or income'),
  
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'upi', 'net-banking', 'wallet', 'other'])
    .withMessage('Invalid payment method')
];

// ==============================================
// BUDGET VALIDATIONS
// ==============================================

exports.budgetValidation = [
  body('category')
    .notEmpty().withMessage('Category is required')
    .isMongoId().withMessage('Invalid category ID'),
  
  body('limitAmount')
    .notEmpty().withMessage('Budget limit is required')
    .isFloat({ min: 0 }).withMessage('Budget limit must be a positive number'),
  
  body('month')
    .optional()
    .isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  
  body('year')
    .optional()
    .isInt({ min: 2020, max: 2100 }).withMessage('Invalid year'),
  
  body('alertThreshold')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('Alert threshold must be between 0 and 100')
];

// ==============================================
// PURCHASE PLAN VALIDATIONS
// ==============================================

exports.purchasePlanValidation = [
  body('itemName')
    .trim()
    .notEmpty().withMessage('Item name is required')
    .isLength({ max: 100 }).withMessage('Item name cannot exceed 100 characters'),
  
  body('targetAmount')
    .notEmpty().withMessage('Target amount is required')
    .isFloat({ min: 1 }).withMessage('Target amount must be greater than 0'),
  
  body('targetDate')
    .notEmpty().withMessage('Target date is required')
    .isISO8601().withMessage('Invalid date format')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Target date must be in the future');
      }
      return true;
    }),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
  
  body('category')
    .optional()
    .isIn(['electronics', 'vehicle', 'property', 'education', 'travel', 'other'])
    .withMessage('Invalid category')
];

// ==============================================
// CATEGORY VALIDATIONS
// ==============================================

exports.categoryValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Category name is required')
    .isLength({ max: 50 }).withMessage('Category name cannot exceed 50 characters'),
  
  body('type')
    .notEmpty().withMessage('Category type is required')
    .isIn(['expense', 'income']).withMessage('Type must be expense or income'),
  
  body('icon')
    .optional()
    .isLength({ max: 10 }).withMessage('Icon cannot exceed 10 characters'),
  
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i).withMessage('Color must be a valid hex color')
];

// ==============================================
// QUERY VALIDATIONS
// ==============================================

exports.dateRangeValidation = [
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format'),
  
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (req.query.startDate && new Date(value) < new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
];

exports.paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

// ==============================================
// PARAM VALIDATIONS
// ==============================================

exports.mongoIdValidation = [
  param('id')
    .isMongoId().withMessage('Invalid ID format')
];