// ==============================================
// FINANCIAL PLANNER CONTROLLER - GOAL BASED
// ==============================================

const Goal = require('../models/Goal');
const User = require('../models/User');
const Expense = require('../models/Expense');
const { asyncHandler } = require('../middleware/errorMiddleware');

// ==============================================
// AI GOAL ANALYSIS FUNCTION
// ==============================================

const analyzeGoal = async (user, goal, currentExpenses) => {
  const monthlyIncome = user.monthlyIncome || 0;
  const remainingBudget = monthlyIncome - currentExpenses;
  
  // Calculate monthly saving required
  const monthlySavingRequired = Math.ceil(goal.targetAmount / goal.timelineMonths);
  
  // Check if achievable
  const isAchievable = monthlySavingRequired <= (remainingBudget * 0.7); // 70% of remaining budget
  
  // Risk level
  let riskLevel = 'Low';
  const savingRatio = (monthlySavingRequired / monthlyIncome) * 100;
  
  if (savingRatio > 40) riskLevel = 'High';
  else if (savingRatio > 25) riskLevel = 'Medium';
  
  // Best purchase time based on category
  let bestPurchaseTime = 'Anytime';
  const currentMonth = new Date().getMonth();
  
  if (goal.category === 'Car' || goal.category === 'House') {
    if (currentMonth >= 9 && currentMonth <= 11) {
      bestPurchaseTime = 'Great timing! Diwali/Year-end offers available';
    } else if (currentMonth >= 6 && currentMonth <= 8) {
      bestPurchaseTime = 'Wait 2-3 months for festive season discounts';
    } else {
      bestPurchaseTime = 'Consider waiting for October-November (Diwali sales)';
    }
  } else if (goal.category === 'Vacation') {
    if (currentMonth >= 3 && currentMonth <= 5) {
      bestPurchaseTime = 'Book now for summer vacation deals';
    } else {
      bestPurchaseTime = 'Best deals available in off-season (June-August)';
    }
  } else if (goal.category === 'Wedding') {
    bestPurchaseTime = 'Start booking 6-12 months in advance for better rates';
  }
  
  // Saving tips
  const savingTips = [];
  
  if (!isAchievable) {
    savingTips.push(`⚠️ Current budget tight. Try to reduce expenses by ₹${Math.ceil(monthlySavingRequired - remainingBudget * 0.7)}/month`);
    savingTips.push(`💡 Consider extending timeline to ${Math.ceil(goal.targetAmount / (remainingBudget * 0.5))} months`);
  }
  
  savingTips.push(`🎯 Save ₹${Math.ceil(monthlySavingRequired/30)}/day to reach your goal`);
  savingTips.push(`📊 This will be ${savingRatio.toFixed(1)}% of your monthly income`);
  
  if (goal.targetAmount > 50000) {
    savingTips.push(`💳 Consider FD/RD for guaranteed returns`);
    savingTips.push(`📈 Invest in liquid mutual funds for 6-8% returns`);
  }
  
  // Alternative options
  const alternativeOptions = [];
  
  if (goal.category === 'Car') {
    alternativeOptions.push('Consider certified pre-owned vehicles (30-40% cheaper)');
    alternativeOptions.push('Explore EV options with government subsidies');
    alternativeOptions.push('Look into corporate lease programs');
  } else if (goal.category === 'House') {
    alternativeOptions.push('Explore affordable housing schemes (PMAY)');
    alternativeOptions.push('Consider smaller cities/suburbs for lower prices');
    alternativeOptions.push('Look into ready-to-move vs under-construction');
  }
  
  // Product links (sample)
  const productLinks = [];
  
  if (goal.category === 'Car' && goal.targetAmount <= 1500000) {
    productLinks.push({
      platform: 'CarDekho',
      url: 'https://www.cardekho.com/cars-between-5-to-10-lakhs',
      price: goal.targetAmount,
      discount: 0
    });
    productLinks.push({
      platform: 'CarWale',
      url: 'https://www.carwale.com/',
      price: goal.targetAmount,
      discount: 0
    });
  }
  
  return {
    monthlySavingRequired,
    isAchievable,
    riskLevel,
    bestPurchaseTime,
    savingTips,
    alternativeOptions,
    productLinks,
    generatedAt: new Date()
  };
};

// ==============================================
// @desc    Create New Goal
// @route   POST /api/planner/goals
// @access  Private
// ==============================================

exports.createGoal = asyncHandler(async (req, res) => {
  const { name, category, targetAmount, timelineMonths, priority, notes } = req.body;
  const userId = req.user.id;

  // Get user and current expenses
  const user = await User.findById(userId);
  
  const startDate = new Date();
  startDate.setDate(1);
  const endDate = new Date();
  
  const expenseData = await Expense.getTotalByDateRange(userId, startDate, endDate, 'expense');
  const currentExpenses = expenseData.total || 0;
  
  // Create goal
  const goal = await Goal.create({
    user: userId,
    name,
    category,
    targetAmount,
    timelineMonths,
    priority: priority || 'Medium',
    notes
  });
  
  // Generate AI recommendations
  const recommendations = await analyzeGoal(user, goal, currentExpenses);
  goal.aiRecommendations = recommendations;
  await goal.save();

  res.status(201).json({
    success: true,
    message: 'Goal created successfully with AI recommendations',
    data: goal
  });
});

// ==============================================
// @desc    Get All Goals
// @route   GET /api/planner/goals
// @access  Private
// ==============================================

exports.getAllGoals = asyncHandler(async (req, res) => {
  const { status = 'Active' } = req.query;
  const userId = req.user.id;

  const query = { user: userId };
  if (status !== 'All') {
    query.status = status;
  }

  const goals = await Goal.find(query).sort({ priority: 1, targetDate: 1 });

  // Calculate summary stats
  const summary = {
    totalGoals: goals.length,
    activeGoals: goals.filter(g => g.status === 'Active').length,
    completedGoals: goals.filter(g => g.status === 'Completed').length,
    totalTargetAmount: goals.reduce((sum, g) => sum + g.targetAmount, 0),
    totalSaved: goals.reduce((sum, g) => sum + g.currentAmount, 0),
    overallProgress: 0
  };

  if (summary.totalTargetAmount > 0) {
    summary.overallProgress = Math.round((summary.totalSaved / summary.totalTargetAmount) * 100);
  }

  res.status(200).json({
    success: true,
    count: goals.length,
    summary,
    data: goals
  });
});

// ==============================================
// @desc    Get Goal by ID
// @route   GET /api/planner/goals/:id
// @access  Private
// ==============================================

exports.getGoalById = asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!goal) {
    return res.status(404).json({
      success: false,
      message: 'Goal not found'
    });
  }

  res.status(200).json({
    success: true,
    data: goal
  });
});

// ==============================================
// @desc    Update Goal
// @route   PUT /api/planner/goals/:id
// @access  Private
// ==============================================

exports.updateGoal = asyncHandler(async (req, res) => {
  let goal = await Goal.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!goal) {
    return res.status(404).json({
      success: false,
      message: 'Goal not found'
    });
  }

  // Update fields
  const allowedUpdates = ['name', 'targetAmount', 'timelineMonths', 'priority', 'notes', 'status'];
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      goal[field] = req.body[field];
    }
  });

  // Regenerate AI recommendations if target/timeline changed
  if (req.body.targetAmount || req.body.timelineMonths) {
    const user = await User.findById(req.user.id);
    const startDate = new Date();
    startDate.setDate(1);
    const endDate = new Date();
    
    const expenseData = await Expense.getTotalByDateRange(req.user.id, startDate, endDate, 'expense');
    const currentExpenses = expenseData.total || 0;
    
    const recommendations = await analyzeGoal(user, goal, currentExpenses);
    goal.aiRecommendations = recommendations;
  }

  await goal.save();

  res.status(200).json({
    success: true,
    message: 'Goal updated successfully',
    data: goal
  });
});

// ==============================================
// @desc    Add Contribution to Goal
// @route   POST /api/planner/goals/:id/contribute
// @access  Private
// ==============================================

exports.addContribution = asyncHandler(async (req, res) => {
  const { amount, source } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid amount is required'
    });
  }

  const goal = await Goal.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!goal) {
    return res.status(404).json({
      success: false,
      message: 'Goal not found'
    });
  }

  await goal.addContribution(amount, source || 'manual');

  const milestonesAchieved = goal.milestones.filter(
    m => new Date(m.achievedAt).getTime() > Date.now() - 5000
  );

  res.status(200).json({
    success: true,
    message: 'Contribution added successfully',
    data: {
      goal,
      milestonesAchieved: milestonesAchieved.length > 0 ? milestonesAchieved : undefined
    }
  });
});

// ==============================================
// @desc    Delete Goal
// @route   DELETE /api/planner/goals/:id
// @access  Private
// ==============================================

exports.deleteGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!goal) {
    return res.status(404).json({
      success: false,
      message: 'Goal not found'
    });
  }

  await goal.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Goal deleted successfully'
  });
});

// ==============================================
// @desc    Regenerate AI Recommendations
// @route   POST /api/planner/goals/:id/regenerate-ai
// @access  Private
// ==============================================

exports.regenerateRecommendations = asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!goal) {
    return res.status(404).json({
      success: false,
      message: 'Goal not found'
    });
  }

  const user = await User.findById(req.user.id);
  const startDate = new Date();
  startDate.setDate(1);
  const endDate = new Date();
  
  const expenseData = await Expense.getTotalByDateRange(req.user.id, startDate, endDate, 'expense');
  const currentExpenses = expenseData.total || 0;
  
  const recommendations = await analyzeGoal(user, goal, currentExpenses);
  goal.aiRecommendations = recommendations;
  await goal.save();

  res.status(200).json({
    success: true,
    message: 'AI recommendations updated',
    data: recommendations
  });
});

// ==============================================
// @desc    Get Goal Insights
// @route   GET /api/planner/insights
// @access  Private
// ==============================================

exports.getInsights = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const goals = await Goal.find({ user: userId, status: 'Active' });
  const user = await User.findById(userId);
  
  const startDate = new Date();
  startDate.setDate(1);
  const endDate = new Date();
  
  const expenseData = await Expense.getTotalByDateRange(userId, startDate, endDate, 'expense');
  const incomeData = await Expense.getTotalByDateRange(userId, startDate, endDate, 'income');
  
  const totalExpense = expenseData.total || 0;
  const totalIncome = incomeData.total || user.monthlyIncome || 0;
  const remainingBudget = totalIncome - totalExpense;
  
  // Calculate total monthly saving required
  const totalMonthlySavingRequired = goals.reduce((sum, g) => {
    return sum + (g.aiRecommendations?.monthlySavingRequired || 0);
  }, 0);
  
  // Check if all goals achievable
  const canAchieveAll = totalMonthlySavingRequired <= (remainingBudget * 0.7);
  
  const insights = {
    totalActiveGoals: goals.length,
    totalTargetAmount: goals.reduce((sum, g) => sum + g.targetAmount, 0),
    totalCurrentAmount: goals.reduce((sum, g) => sum + g.currentAmount, 0),
    totalMonthlySavingRequired,
    availableBudget: remainingBudget,
    canAchieveAll,
    recommendations: [],
    urgentGoals: goals.filter(g => g.monthsRemaining <= 3),
    onTrackGoals: goals.filter(g => g.progress >= 80),
    strugglingGoals: goals.filter(g => {
      const expectedProgress = ((g.timelineMonths - g.monthsRemaining) / g.timelineMonths) * 100;
      return g.progress < expectedProgress - 20;
    })
  };
  
  // Generate recommendations
  if (!canAchieveAll) {
    insights.recommendations.push({
      type: 'warning',
      icon: '⚠️',
      message: `Total saving required (₹${totalMonthlySavingRequired.toLocaleString('en-IN')}) exceeds available budget`,
      action: 'Consider prioritizing goals or extending timelines'
    });
  }
  
  if (insights.urgentGoals.length > 0) {
    insights.recommendations.push({
      type: 'urgent',
      icon: '🚨',
      message: `${insights.urgentGoals.length} goal(s) due in 3 months`,
      action: 'Focus on high-priority goals'
    });
  }
  
  if (insights.strugglingGoals.length > 0) {
    insights.recommendations.push({
      type: 'info',
      icon: '📊',
      message: `${insights.strugglingGoals.length} goal(s) behind schedule`,
      action: 'Increase monthly contributions'
    });
  }

  res.status(200).json({
    success: true,
    data: insights
  });
});

module.exports = exports;