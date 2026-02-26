// ==============================================
// USER CONTROLLER
// ==============================================

const User = require('../models/User');
const FinancialProfile = require('../models/FinancialProfile');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { cloudinary, upload } = require('../config/cloudinary');

// ==============================================
// @desc    Get User Profile
// @route   GET /api/user/profile
// @access  Private
// ==============================================

exports.getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user.getPublicProfile()
  });
});

// ==============================================
// @desc    Update User Profile
// @route   PUT /api/user/profile
// @access  Private
// ==============================================

exports.updateProfile = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    phone: req.body.phone
  };

  const user = await User.findByIdAndUpdate(
    req.user.id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: user.getPublicProfile()
  });
});

// ==============================================
// @desc    Upload Avatar
// @route   POST /api/user/avatar
// @access  Private
// ==============================================

exports.uploadAvatar = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload an image'
    });
  }

  const user = await User.findById(req.user.id);

  // Delete old avatar from cloudinary if exists
  if (user.avatar && user.avatar.includes('cloudinary')) {
    const publicId = user.avatar.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(`finsarthi/${publicId}`);
  }

  // Update avatar
  user.avatar = req.file.path;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Avatar uploaded successfully',
    data: {
      avatar: user.avatar
    }
  });
});

// ==============================================
// @desc    Delete Account
// @route   DELETE /api/user/account
// @access  Private
// ==============================================

exports.deleteAccount = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Verify password
  const isMatch = await user.comparePassword(req.body.password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Incorrect password'
    });
  }

  // Soft delete - deactivate account
  user.isActive = false;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Account deactivated successfully'
  });
});

// ==============================================
// @desc    Get Financial Profile
// @route   GET /api/user/financial-profile
// @access  Private
// ==============================================

exports.getFinancialProfile = asyncHandler(async (req, res, next) => {
  let profile = await FinancialProfile.findOne({ user: req.user.id });

  if (!profile) {
    // Create default profile if not exists
    profile = await FinancialProfile.create({
      user: req.user.id,
      monthlyIncome: 0
    });
  }

  res.status(200).json({
    success: true,
    data: profile
  });
});

// ==============================================
// @desc    Update Financial Profile
// @route   PUT /api/user/financial-profile
// @access  Private
// ==============================================

exports.updateFinancialProfile = asyncHandler(async (req, res, next) => {
  const {
    monthlyIncome,
    fixedExpenses,
    savingsGoal,
    riskAppetite,
    investmentPreference,
    debt,
    emergencyFund
  } = req.body;

  let profile = await FinancialProfile.findOne({ user: req.user.id });

  if (!profile) {
    // Create new profile
    profile = await FinancialProfile.create({
      user: req.user.id,
      monthlyIncome,
      fixedExpenses,
      savingsGoal,
      riskAppetite,
      investmentPreference,
      debt,
      emergencyFund
    });
  } else {
    // Update existing profile
    profile.monthlyIncome = monthlyIncome || profile.monthlyIncome;
    profile.fixedExpenses = fixedExpenses !== undefined ? fixedExpenses : profile.fixedExpenses;
    profile.savingsGoal = savingsGoal || profile.savingsGoal;
    profile.riskAppetite = riskAppetite || profile.riskAppetite;
    profile.investmentPreference = investmentPreference || profile.investmentPreference;
    profile.debt = debt || profile.debt;
    profile.emergencyFund = emergencyFund || profile.emergencyFund;

    await profile.save();
  }

  // Calculate health score
  profile.calculateHealthScore();
  await profile.save();

  res.status(200).json({
    success: true,
    message: 'Financial profile updated successfully',
    data: profile
  });
});

// ==============================================
// @desc    Get Financial Health Score
// @route   GET /api/user/health-score
// @access  Private
// ==============================================

exports.getHealthScore = asyncHandler(async (req, res, next) => {
  const profile = await FinancialProfile.findOne({ user: req.user.id });

  if (!profile) {
    return res.status(404).json({
      success: false,
      message: 'Financial profile not found. Please complete your profile first.'
    });
  }

  // Recalculate score
  const score = profile.calculateHealthScore();
  await profile.save();

  res.status(200).json({
    success: true,
    data: {
      score: profile.financialHealthScore,
      status: profile.getHealthStatus(),
      lastUpdate: profile.lastScoreUpdate,
      breakdown: {
        savingsRate: ((profile.monthlyIncome - profile.fixedExpenses) / profile.monthlyIncome * 100).toFixed(2),
        debtRatio: profile.debtToIncomeRatio,
        emergencyFundMonths: (profile.emergencyFund.currentAmount / profile.fixedExpenses).toFixed(1)
      }
    }
  });
});

// ==============================================
// @desc    Get Dashboard Stats
// @route   GET /api/user/dashboard
// @access  Private
// ==============================================

exports.getDashboard = asyncHandler(async (req, res, next) => {
  const Expense = require('../models/Expense');
  const Budget = require('../models/Budget');

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Get financial profile
  const profile = await FinancialProfile.findOne({ user: req.user.id });

  // Get current month expenses
  const expenses = await Expense.getTotalByDateRange(
    req.user.id,
    startOfMonth,
    endOfMonth,
    'expense'
  );

  // Get current month income
  const income = await Expense.getTotalByDateRange(
    req.user.id,
    startOfMonth,
    endOfMonth,
    'income'
  );

  // Get budgets
  const budgets = await Budget.getCurrentMonthBudgets(req.user.id);

  // Calculate savings
  const savings = income - expenses;
  const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(2) : 0;

  res.status(200).json({
    success: true,
    data: {
      currentMonth: {
        income,
        expenses,
        savings,
        savingsRate
      },
      budgets: budgets.map(b => ({
        category: b.category.name,
        limit: b.limitAmount,
        spent: b.spentAmount,
        remaining: b.remainingAmount,
        percentage: b.percentageUsed,
        status: b.status
      })),
      healthScore: profile ? profile.financialHealthScore : 0,
      healthStatus: profile ? profile.getHealthStatus() : 'Unknown'
    }
  });
});