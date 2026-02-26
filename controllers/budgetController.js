// ==============================================
// BUDGET CONTROLLER
// ==============================================

const Budget = require('../models/Budget');
const Category = require('../models/Category');
const Expense = require('../models/Expense');
const Alert = require('../models/Alert');
const { asyncHandler } = require('../middleware/errorMiddleware');

// ==============================================
// @desc    Create/Set Budget
// @route   POST /api/budget
// @access  Private
// ==============================================

exports.setBudget = asyncHandler(async (req, res, next) => {
  const { category, limitAmount, month, year, alertThreshold } = req.body;

  // Verify category
  const categoryExists = await Category.findOne({
    _id: category,
    user: req.user.id
  });

  if (!categoryExists) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  const budgetMonth = month || new Date().getMonth() + 1;
  const budgetYear = year || new Date().getFullYear();

  // Check if budget already exists
  let budget = await Budget.findOne({
    user: req.user.id,
    category,
    month: budgetMonth,
    year: budgetYear
  });

  if (budget) {
    // Update existing budget
    budget.limitAmount = limitAmount;
    budget.alertThreshold = alertThreshold || budget.alertThreshold;
    budget.isAlertSent = false;
    await budget.save();
  } else {
    // Create new budget
    budget = await Budget.create({
      user: req.user.id,
      category,
      limitAmount,
      month: budgetMonth,
      year: budgetYear,
      alertThreshold: alertThreshold || 80
    });
  }

  // Calculate current spent amount
  await budget.updateSpentAmount();

  const populatedBudget = await Budget.findById(budget._id)
    .populate('category', 'name icon color');

  res.status(201).json({
    success: true,
    message: 'Budget set successfully',
    data: populatedBudget
  });
});

// ==============================================
// @desc    Get All Budgets
// @route   GET /api/budget
// @access  Private
// ==============================================

exports.getBudgets = asyncHandler(async (req, res, next) => {
  const { month, year } = req.query;

  const budgetMonth = month || new Date().getMonth() + 1;
  const budgetYear = year || new Date().getFullYear();

  const budgets = await Budget.find({
    user: req.user.id,
    month: budgetMonth,
    year: budgetYear
  })
    .populate('category', 'name icon color')
    .sort({ limitAmount: -1 });

  // Update spent amounts
  for (let budget of budgets) {
    await budget.updateSpentAmount();
  }

  res.status(200).json({
    success: true,
    count: budgets.length,
    data: budgets
  });
});

// ==============================================
// @desc    Get Single Budget
// @route   GET /api/budget/:id
// @access  Private
// ==============================================

exports.getBudget = asyncHandler(async (req, res, next) => {
  const budget = await Budget.findOne({
    _id: req.params.id,
    user: req.user.id
  }).populate('category', 'name icon color');

  if (!budget) {
    return res.status(404).json({
      success: false,
      message: 'Budget not found'
    });
  }

  await budget.updateSpentAmount();

  res.status(200).json({
    success: true,
    data: budget
  });
});

// ==============================================
// @desc    Update Budget
// @route   PUT /api/budget/:id
// @access  Private
// ==============================================

exports.updateBudget = asyncHandler(async (req, res, next) => {
  let budget = await Budget.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!budget) {
    return res.status(404).json({
      success: false,
      message: 'Budget not found'
    });
  }

  const { limitAmount, alertThreshold } = req.body;

  budget.limitAmount = limitAmount || budget.limitAmount;
  budget.alertThreshold = alertThreshold !== undefined ? alertThreshold : budget.alertThreshold;
  budget.isAlertSent = false;

  await budget.save();
  await budget.updateSpentAmount();

  const populatedBudget = await Budget.findById(budget._id)
    .populate('category', 'name icon color');

  res.status(200).json({
    success: true,
    message: 'Budget updated successfully',
    data: populatedBudget
  });
});

// ==============================================
// @desc    Delete Budget
// @route   DELETE /api/budget/:id
// @access  Private
// ==============================================

exports.deleteBudget = asyncHandler(async (req, res, next) => {
  const budget = await Budget.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!budget) {
    return res.status(404).json({
      success: false,
      message: 'Budget not found'
    });
  }

  await budget.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Budget deleted successfully'
  });
});

// ==============================================
// @desc    Get Budget Status/Overview
// @route   GET /api/budget/status
// @access  Private
// ==============================================

exports.getBudgetStatus = asyncHandler(async (req, res, next) => {
  const { month, year } = req.query;

  const budgetMonth = month || new Date().getMonth() + 1;
  const budgetYear = year || new Date().getFullYear();

  const budgets = await Budget.find({
    user: req.user.id,
    month: budgetMonth,
    year: budgetYear
  }).populate('category', 'name icon color');

  // Update all budgets
  for (let budget of budgets) {
    await budget.updateSpentAmount();
  }

  // Calculate statistics
  const totalBudget = budgets.reduce((sum, b) => sum + b.limitAmount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
  const totalRemaining = totalBudget - totalSpent;

  const exceededBudgets = budgets.filter(b => b.isExceeded);
  const warningBudgets = budgets.filter(b => b.status === 'warning');
  const safeBudgets = budgets.filter(b => b.status === 'safe');

  res.status(200).json({
    success: true,
    data: {
      summary: {
        totalBudget,
        totalSpent,
        totalRemaining,
        percentageUsed: totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(2) : 0
      },
      categoryCounts: {
        total: budgets.length,
        exceeded: exceededBudgets.length,
        warning: warningBudgets.length,
        safe: safeBudgets.length
      },
      budgets: budgets.map(b => ({
        id: b._id,
        category: b.category,
        limit: b.limitAmount,
        spent: b.spentAmount,
        remaining: b.remainingAmount,
        percentage: b.percentageUsed,
        status: b.status,
        isExceeded: b.isExceeded
      }))
    }
  });
});

// ==============================================
// @desc    Get Budget History
// @route   GET /api/budget/history/:categoryId
// @access  Private
// ==============================================

exports.getBudgetHistory = asyncHandler(async (req, res, next) => {
  const { categoryId } = req.params;
  const { months = 6 } = req.query;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const budgets = await Budget.find({
    user: req.user.id,
    category: categoryId,
    $or: [
      { year: { $gt: startDate.getFullYear() } },
      {
        year: startDate.getFullYear(),
        month: { $gte: startDate.getMonth() + 1 }
      }
    ]
  })
    .populate('category', 'name icon color')
    .sort({ year: 1, month: 1 });

  res.status(200).json({
    success: true,
    count: budgets.length,
    data: budgets
  });
});

// ==============================================
// @desc    Check Budget Alerts
// @route   POST /api/budget/check-alerts
// @access  Private
// ==============================================

exports.checkBudgetAlerts = asyncHandler(async (req, res, next) => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const budgets = await Budget.find({
    user: req.user.id,
    month,
    year
  }).populate('category', 'name');

  const alerts = [];

  for (let budget of budgets) {
    await budget.updateSpentAmount();

    if (budget.shouldSendAlert()) {
      const alert = await Alert.createAlert(
        req.user.id,
        'budget_warning',
        `Budget Alert: ${budget.category.name}`,
        `You've used ${budget.percentageUsed}% of your budget`,
        {
          severity: 'warning',
          metadata: { budgetId: budget._id }
        }
      );

      budget.isAlertSent = true;
      await budget.save();
      alerts.push(alert);
    }

    if (budget.isExceeded && !budget.isAlertSent) {
      const alert = await Alert.createAlert(
        req.user.id,
        'budget_exceeded',
        `Budget Exceeded: ${budget.category.name}`,
        `Your budget has been exceeded by ₹${budget.spentAmount - budget.limitAmount}`,
        {
          severity: 'critical',
          metadata: { budgetId: budget._id }
        }
      );

      alerts.push(alert);
    }
  }

  res.status(200).json({
    success: true,
    message: `${alerts.length} alerts generated`,
    data: alerts
  });
});