// ==============================================
// EXPENSE CONTROLLER - FIXED
// ==============================================

const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Category = require('../models/Category');
const Alert = require('../models/Alert');
const { asyncHandler } = require('../middleware/errorMiddleware');

// ==============================================
// @desc    Add Expense
// @route   POST /api/expenses
// @access  Private
// ==============================================

exports.addExpense = asyncHandler(async (req, res, next) => {
  const {
    amount,
    description,
    category,
    date,
    type,
    paymentMethod,
    isRecurring,
    recurringPeriod,
    tags,
    notes
  } = req.body;

  // ✅ REMOVED - Category verification (since category is now a string, not ObjectId)
  // Category validation already done in validation middleware

  const expense = await Expense.create({
    user: req.user.id,
    amount,
    description,
    category, // String value like "Food & Dining"
    date: date || Date.now(),
    type: type || 'expense',
    paymentMethod,
    isRecurring,
    recurringPeriod,
    tags,
    notes
  });

  // ✅ SIMPLIFIED - Budget update without category lookup
  if (type === 'expense') {
    const expenseDate = new Date(date || Date.now());
    const month = expenseDate.getMonth() + 1;
    const year = expenseDate.getFullYear();

    const budget = await Budget.findOne({
      user: req.user.id,
      category,
      month,
      year
    });

    if (budget) {
      await budget.updateSpentAmount();

      // Check if alert should be sent
      if (budget.shouldSendAlert()) {
        await Alert.createAlert(
          req.user.id,
          'budget_warning',
          'Budget Alert',
          `You've used ${budget.percentageUsed}% of your ${category} budget`,
          {
            severity: 'warning',
            metadata: { budgetId: budget._id, category: category }
          }
        );

        budget.isAlertSent = true;
        await budget.save();
      }

      // Check if exceeded
      if (budget.isExceeded) {
        await Alert.createAlert(
          req.user.id,
          'budget_exceeded',
          'Budget Exceeded!',
          `Your ${category} budget has been exceeded by ₹${budget.spentAmount - budget.limitAmount}`,
          {
            severity: 'critical',
            metadata: { budgetId: budget._id, category: category }
          }
        );
      }
    }
  }

  // ✅ REMOVED - .populate() since category is not a reference anymore
  res.status(201).json({
    success: true,
    message: 'Expense added successfully',
    data: expense
  });
});

// ==============================================
// @desc    Get All Expenses
// @route   GET /api/expenses
// @access  Private
// ==============================================

exports.getExpenses = asyncHandler(async (req, res, next) => {
  const {
    startDate,
    endDate,
    category,
    type,
    page = 1,
    limit = 50,
    sort = '-date'
  } = req.query;

  // Build query
  const query = { user: req.user.id };

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  if (category) query.category = category;
  if (type) query.type = type;

  // Execute query with pagination
  const expenses = await Expense.find(query)
    // ✅ REMOVED - .populate('category') since it's a string now
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Expense.countDocuments(query);

  res.status(200).json({
    success: true,
    count: expenses.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: expenses
  });
});

// ==============================================
// @desc    Get Single Expense
// @route   GET /api/expenses/:id
// @access  Private
// ==============================================

exports.getExpense = asyncHandler(async (req, res, next) => {
  const expense = await Expense.findOne({
    _id: req.params.id,
    user: req.user.id
  });
  // ✅ REMOVED - .populate('category')

  if (!expense) {
    return res.status(404).json({
      success: false,
      message: 'Expense not found'
    });
  }

  res.status(200).json({
    success: true,
    data: expense
  });
});

// ==============================================
// @desc    Update Expense
// @route   PUT /api/expenses/:id
// @access  Private
// ==============================================

exports.updateExpense = asyncHandler(async (req, res, next) => {
  let expense = await Expense.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!expense) {
    return res.status(404).json({
      success: false,
      message: 'Expense not found'
    });
  }

  const oldCategory = expense.category;
  const oldAmount = expense.amount;
  const oldDate = expense.date;

  expense = await Expense.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );
  // ✅ REMOVED - .populate('category')

  // Update budgets if category or amount changed
  if (expense.type === 'expense') {
    // Update old budget
    const oldExpenseDate = new Date(oldDate);
    const oldBudget = await Budget.findOne({
      user: req.user.id,
      category: oldCategory,
      month: oldExpenseDate.getMonth() + 1,
      year: oldExpenseDate.getFullYear()
    });

    if (oldBudget) {
      await oldBudget.updateSpentAmount();
    }

    // Update new budget
    const newExpenseDate = new Date(expense.date);
    const newBudget = await Budget.findOne({
      user: req.user.id,
      category: expense.category,
      month: newExpenseDate.getMonth() + 1,
      year: newExpenseDate.getFullYear()
    });

    if (newBudget) {
      await newBudget.updateSpentAmount();
    }
  }

  res.status(200).json({
    success: true,
    message: 'Expense updated successfully',
    data: expense
  });
});

// ==============================================
// @desc    Delete Expense
// @route   DELETE /api/expenses/:id
// @access  Private
// ==============================================

exports.deleteExpense = asyncHandler(async (req, res, next) => {
  const expense = await Expense.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!expense) {
    return res.status(404).json({
      success: false,
      message: 'Expense not found'
    });
  }

  const category = expense.category;
  const expenseDate = new Date(expense.date);

  await expense.deleteOne();

  // Update budget
  if (expense.type === 'expense') {
    const budget = await Budget.findOne({
      user: req.user.id,
      category,
      month: expenseDate.getMonth() + 1,
      year: expenseDate.getFullYear()
    });

    if (budget) {
      await budget.updateSpentAmount();
    }
  }

  res.status(200).json({
    success: true,
    message: 'Expense deleted successfully'
  });
});

// ==============================================
// @desc    Get Expense Statistics
// @route   GET /api/expenses/stats
// @access  Private
// ==============================================

exports.getExpenseStats = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const end = endDate ? new Date(endDate) : new Date();

  // Total by type
  const totalExpenses = await Expense.getTotalByDateRange(req.user.id, start, end, 'expense');
  const totalIncome = await Expense.getTotalByDateRange(req.user.id, start, end, 'income');

  // By category
  const byCategory = await Expense.getByCategory(req.user.id, start, end);

  // Monthly trend
  const monthlyTrend = await Expense.getMonthlyTrend(req.user.id, 6);

  res.status(200).json({
    success: true,
    data: {
      summary: {
        totalExpenses: totalExpenses.total || 0,
        totalIncome: totalIncome.total || 0,
        balance: (totalIncome.total || 0) - (totalExpenses.total || 0),
        savingsRate: totalIncome.total > 0 ? (((totalIncome.total - totalExpenses.total) / totalIncome.total) * 100).toFixed(2) : 0
      },
      byCategory,
      monthlyTrend
    }
  });
});