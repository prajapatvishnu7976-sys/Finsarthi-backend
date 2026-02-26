// ==============================================
// PURCHASE ADVISOR CONTROLLER
// ==============================================

const PurchasePlan = require('../models/PurchasePlan');
const FinancialProfile = require('../models/FinancialProfile');
const Expense = require('../models/Expense');
const { asyncHandler } = require('../middleware/errorMiddleware');

// ==============================================
// @desc    Create Purchase Plan
// @route   POST /api/purchase
// @access  Private
// ==============================================

exports.createPurchasePlan = asyncHandler(async (req, res, next) => {
  const {
    itemName,
    targetAmount,
    targetDate,
    priority,
    category,
    description,
    imageUrl
  } = req.body;

  const plan = await PurchasePlan.create({
    user: req.user.id,
    itemName,
    targetAmount,
    targetDate,
    priority,
    category,
    description,
    imageUrl
  });

  // Calculate EMI options
  plan.calculateEMI();

  // Generate recommendations
  await plan.generateRecommendations();

  await plan.save();

  res.status(201).json({
    success: true,
    message: 'Purchase plan created successfully',
    data: plan
  });
});

// ==============================================
// @desc    Get All Purchase Plans
// @route   GET /api/purchase
// @access  Private
// ==============================================

exports.getPurchasePlans = asyncHandler(async (req, res, next) => {
  const { isCompleted, priority, category } = req.query;

  const query = { user: req.user.id };

  if (isCompleted !== undefined) {
    query.isCompleted = isCompleted === 'true';
  }

  if (priority) query.priority = priority;
  if (category) query.category = category;

  const plans = await PurchasePlan.find(query)
    .sort({ priority: -1, targetDate: 1 });

  res.status(200).json({
    success: true,
    count: plans.length,
    data: plans
  });
});

// ==============================================
// @desc    Get Single Purchase Plan
// @route   GET /api/purchase/:id
// @access  Private
// ==============================================

exports.getPurchasePlan = asyncHandler(async (req, res, next) => {
  const plan = await PurchasePlan.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!plan) {
    return res.status(404).json({
      success: false,
      message: 'Purchase plan not found'
    });
  }

  res.status(200).json({
    success: true,
    data: plan
  });
});

// ==============================================
// @desc    Update Purchase Plan
// @route   PUT /api/purchase/:id
// @access  Private
// ==============================================

exports.updatePurchasePlan = asyncHandler(async (req, res, next) => {
  let plan = await PurchasePlan.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!plan) {
    return res.status(404).json({
      success: false,
      message: 'Purchase plan not found'
    });
  }

  const allowedUpdates = [
    'itemName',
    'targetAmount',
    'currentSaved',
    'targetDate',
    'priority',
    'category',
    'description',
    'imageUrl'
  ];

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      plan[field] = req.body[field];
    }
  });

  await plan.save();

  // Recalculate if amount changed
  if (req.body.targetAmount) {
    plan.calculateEMI();
    await plan.generateRecommendations();
    await plan.save();
  }

  res.status(200).json({
    success: true,
    message: 'Purchase plan updated successfully',
    data: plan
  });
});

// ==============================================
// @desc    Delete Purchase Plan
// @route   DELETE /api/purchase/:id
// @access  Private
// ==============================================

exports.deletePurchasePlan = asyncHandler(async (req, res, next) => {
  const plan = await PurchasePlan.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!plan) {
    return res.status(404).json({
      success: false,
      message: 'Purchase plan not found'
    });
  }

  await plan.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Purchase plan deleted successfully'
  });
});

// ==============================================
// @desc    Mark Purchase as Complete
// @route   POST /api/purchase/:id/complete
// @access  Private
// ==============================================

exports.completePurchase = asyncHandler(async (req, res, next) => {
  const plan = await PurchasePlan.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!plan) {
    return res.status(404).json({
      success: false,
      message: 'Purchase plan not found'
    });
  }

  plan.isCompleted = true;
  plan.completedAt = Date.now();
  await plan.save();

  res.status(200).json({
    success: true,
    message: 'Purchase marked as complete',
    data: plan
  });
});

// ==============================================
// @desc    Analyze Purchase Affordability
// @route   POST /api/purchase/analyze
// @access  Private
// ==============================================

exports.analyzePurchase = asyncHandler(async (req, res, next) => {
  const { itemName, price, category } = req.body;

  if (!itemName || !price) {
    return res.status(400).json({
      success: false,
      message: 'Item name and price are required'
    });
  }

  // Get user's financial profile
  const profile = await FinancialProfile.findOne({ user: req.user.id });

  if (!profile) {
    return res.status(404).json({
      success: false,
      message: 'Please complete your financial profile first'
    });
  }

  // Get current month expenses
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const monthlyExpenses = await Expense.getTotalByDateRange(
    req.user.id,
    startOfMonth,
    endOfMonth,
    'expense'
  );

  // Calculate disposable income
  const disposableIncome = profile.monthlyIncome - profile.fixedExpenses - profile.debt.emi;
  const currentSavings = profile.emergencyFund.currentAmount || 0;

  // Analysis
  const canAffordNow = currentSavings >= price;
  const monthsToSave = Math.ceil(price / (disposableIncome * 0.3)); // 30% of disposable income
  const affordabilityPercentage = (price / profile.monthlyIncome * 100).toFixed(2);

  // EMI Calculation (10% interest rate)
  const emiOptions = [];
  [6, 12, 18, 24].forEach(months => {
    const monthlyRate = 10 / 12 / 100;
    const emi = (price * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                (Math.pow(1 + monthlyRate, months) - 1);
    
    emiOptions.push({
      months,
      monthlyPayment: Math.round(emi),
      totalAmount: Math.round(emi * months),
      totalInterest: Math.round((emi * months) - price),
      affordable: emi < (disposableIncome * 0.4)
    });
  });

  // Risk Assessment
  let riskLevel = 'low';
  let recommendation = '';

  if (price > profile.monthlyIncome * 3) {
    riskLevel = 'high';
    recommendation = 'This purchase is expensive relative to your income. Consider saving for a longer period or opting for EMI.';
  } else if (price > profile.monthlyIncome) {
    riskLevel = 'medium';
    recommendation = 'This purchase is significant. Ensure you maintain your emergency fund.';
  } else {
    riskLevel = 'low';
    recommendation = 'This purchase is within your budget. You can afford it without significant financial stress.';
  }

  // Best option
  let bestOption = '';
  if (canAffordNow) {
    bestOption = 'Buy now with savings';
  } else if (monthsToSave <= 3) {
    bestOption = `Save for ${monthsToSave} months`;
  } else {
    const affordableEMI = emiOptions.find(e => e.affordable);
    bestOption = affordableEMI ? `${affordableEMI.months}-month EMI` : 'Save longer or reconsider';
  }

  res.status(200).json({
    success: true,
    data: {
      item: itemName,
      price,
      analysis: {
        canAffordNow,
        monthsToSave,
        affordabilityPercentage,
        riskLevel,
        bestOption,
        recommendation
      },
      financialImpact: {
        percentageOfIncome: affordabilityPercentage,
        monthlyBudgetImpact: ((price / profile.monthlyIncome) * 100).toFixed(2),
        savingsImpact: canAffordNow ? ((price / currentSavings) * 100).toFixed(2) : 'N/A'
      },
      emiOptions,
      alternatives: {
        waitAndSave: `Save ₹${Math.round(price / monthsToSave)}/month for ${monthsToSave} months`,
        reducedVersion: `Consider a lower-priced alternative around ₹${Math.round(price * 0.7)}`,
        cashback: 'Look for cashback offers or discounts'
      }
    }
  });
});

// ==============================================
// @desc    Get Purchase Recommendations
// @route   GET /api/purchase/recommendations
// @access  Private
// ==============================================

exports.getRecommendations = asyncHandler(async (req, res, next) => {
  const profile = await FinancialProfile.findOne({ user: req.user.id });

  if (!profile) {
    return res.status(404).json({
      success: false,
      message: 'Please complete your financial profile first'
    });
  }

  const disposableIncome = profile.monthlyIncome - profile.fixedExpenses - profile.debt.emi;

  const recommendations = [];

  // Build emergency fund
  const emergencyFundTarget = profile.fixedExpenses * 6;
  if (profile.emergencyFund.currentAmount < emergencyFundTarget) {
    recommendations.push({
      type: 'emergency_fund',
      priority: 'high',
      title: 'Build Emergency Fund',
      message: `Save ₹${Math.round(emergencyFundTarget - profile.emergencyFund.currentAmount)} more to reach 6 months of expenses`,
      action: 'Set aside money for emergencies first'
    });
  }

  // Pay off high-interest debt
  if (profile.debt.totalAmount > 0 && profile.debt.interestRate > 12) {
    recommendations.push({
      type: 'debt_payment',
      priority: 'high',
      title: 'Pay High-Interest Debt',
      message: `Your ${profile.debt.loanType} has ${profile.debt.interestRate}% interest`,
      action: 'Prioritize paying off this debt before major purchases'
    });
  }

  // Savings opportunity
  if (disposableIncome > 10000) {
    recommendations.push({
      type: 'savings',
      priority: 'medium',
      title: 'Increase Savings',
      message: `You can save up to ₹${Math.round(disposableIncome * 0.5)}/month`,
      action: 'Consider setting up automatic savings'
    });
  }

  // Investment suggestion
  if (profile.emergencyFund.currentAmount >= emergencyFundTarget && profile.riskAppetite !== 'low') {
    recommendations.push({
      type: 'investment',
      priority: 'medium',
      title: 'Start Investing',
      message: 'Your emergency fund is solid. Consider investing for long-term goals.',
      action: 'Explore investment options based on your risk appetite'
    });
  }

  res.status(200).json({
    success: true,
    count: recommendations.length,
    data: recommendations
  });
});