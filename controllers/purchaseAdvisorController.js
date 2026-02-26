// ==============================================
// SMART PURCHASE ADVISOR - ENHANCED AI ENGINE
// ==============================================

const User = require('../models/User');
const Expense = require('../models/Expense');
const { asyncHandler } = require('../middleware/errorMiddleware');

// Upcoming Sales Data (Real Dates)
const upcomingSales = [
  {
    name: 'Amazon Great Indian Festival',
    platform: 'Amazon',
    startDate: '2025-10-01',
    endDate: '2025-10-07',
    discount: '40-80%',
    categories: ['electronics', 'appliances', 'clothing']
  },
  {
    name: 'Flipkart Big Billion Days',
    platform: 'Flipkart',
    startDate: '2025-10-01',
    endDate: '2025-10-06',
    discount: '50-80%',
    categories: ['electronics', 'appliances', 'furniture']
  },
  {
    name: 'Myntra End of Reason Sale',
    platform: 'Myntra',
    startDate: '2025-06-01',
    endDate: '2025-06-07',
    discount: '50-80%',
    categories: ['clothing']
  },
  {
    name: 'Diwali Sale',
    platform: 'All Platforms',
    startDate: '2025-10-20',
    endDate: '2025-11-05',
    discount: '30-70%',
    categories: ['electronics', 'appliances', 'clothing', 'furniture', 'other']
  },
  {
    name: 'Republic Day Sale',
    platform: 'All Platforms',
    startDate: '2026-01-20',
    endDate: '2026-01-26',
    discount: '30-60%',
    categories: ['electronics', 'appliances', 'clothing', 'furniture']
  },
  {
    name: 'Independence Day Sale',
    platform: 'All Platforms',
    startDate: '2025-08-10',
    endDate: '2025-08-15',
    discount: '30-50%',
    categories: ['electronics', 'appliances', 'clothing']
  }
];

// Cashback Offers by Payment Method
const cashbackOffers = [
  {
    method: 'HDFC Credit Card',
    cashback: '10%',
    maxCashback: 2500,
    validOn: ['Amazon', 'Flipkart'],
    validCategories: ['electronics', 'appliances']
  },
  {
    method: 'ICICI Credit Card',
    cashback: '10%',
    maxCashback: 2000,
    validOn: ['Amazon'],
    validCategories: ['electronics', 'appliances', 'clothing']
  },
  {
    method: 'SBI Credit Card',
    cashback: '5%',
    maxCashback: 1500,
    validOn: ['Flipkart', 'Myntra'],
    validCategories: ['electronics', 'clothing']
  },
  {
    method: 'Amazon Pay ICICI',
    cashback: '5%',
    maxCashback: 'Unlimited',
    validOn: ['Amazon'],
    validCategories: ['electronics', 'appliances', 'clothing', 'other']
  },
  {
    method: 'Flipkart Axis Card',
    cashback: '5%',
    maxCashback: 'Unlimited',
    validOn: ['Flipkart', 'Myntra'],
    validCategories: ['electronics', 'clothing', 'appliances']
  },
  {
    method: 'No Cost EMI',
    cashback: '0% Interest',
    maxCashback: 'Save Interest',
    validOn: ['Amazon', 'Flipkart'],
    validCategories: ['electronics', 'appliances', 'furniture']
  }
];

// Category-wise Price Trends
const priceTrends = {
  electronics: {
    bestMonths: ['October', 'January', 'August'],
    worstMonths: ['April', 'May', 'September'],
    averageDiscount: 25,
    festivalDiscount: 45,
    tip: 'Electronics get maximum discounts during Diwali (October) and Republic Day (January)'
  },
  appliances: {
    bestMonths: ['October', 'November', 'January'],
    worstMonths: ['March', 'April', 'July'],
    averageDiscount: 30,
    festivalDiscount: 50,
    tip: 'Home appliances see biggest price drops during festive season sales'
  },
  clothing: {
    bestMonths: ['June', 'July', 'December', 'January'],
    worstMonths: ['September', 'October'],
    averageDiscount: 40,
    festivalDiscount: 60,
    tip: 'End of season sales (June-July, Dec-Jan) offer best clothing deals'
  },
  furniture: {
    bestMonths: ['January', 'October', 'November'],
    worstMonths: ['May', 'June'],
    averageDiscount: 20,
    festivalDiscount: 40,
    tip: 'Furniture discounts peak during Republic Day and Diwali'
  },
  travel: {
    bestMonths: ['January', 'February', 'September'],
    worstMonths: ['May', 'June', 'December'],
    averageDiscount: 15,
    festivalDiscount: 25,
    tip: 'Book flights 2-3 months in advance and avoid peak seasons'
  },
  other: {
    bestMonths: ['October', 'November', 'January'],
    worstMonths: ['April', 'May'],
    averageDiscount: 20,
    festivalDiscount: 35,
    tip: 'General products get good discounts during major sale events'
  }
};

// @desc    Analyze Purchase Affordability - Enhanced
// @route   POST /api/advisor/purchase-check
// @access  Private
exports.analyzePurchase = asyncHandler(async (req, res) => {
  const { itemName, itemPrice, category, urgency } = req.body;
  
  // Validate input
  if (!itemName || !itemPrice) {
    return res.status(400).json({
      success: false,
      message: 'Item name and price are required'
    });
  }

  // Get user data
  const user = await User.findById(req.user.id);
  
  // Get current month expenses
  const startDate = new Date();
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(0);
  endDate.setHours(23, 59, 59, 999);
  
  const expenses = await Expense.getTotalByDateRange(
    req.user.id,
    startDate,
    endDate,
    'expense'
  );
  
  const incomeData = await Expense.getTotalByDateRange(
    req.user.id,
    startDate,
    endDate,
    'income'
  );
  
  const totalExpense = expenses.total || 0;
  const totalIncomeThisMonth = incomeData.total || 0;
  const monthlyIncome = user.monthlyIncome || totalIncomeThisMonth || 50000; // Default fallback
  const savingsGoal = user.savingsGoal || monthlyIncome * 0.2;
  
  // Calculate metrics
  const remainingBudget = monthlyIncome - totalExpense;
  const affordabilityScore = monthlyIncome > 0 ? Math.round((remainingBudget / monthlyIncome) * 100) : 0;
  const priceToIncomeRatio = monthlyIncome > 0 ? Math.round((itemPrice / monthlyIncome) * 100) : 100;
  const priceToRemainingRatio = remainingBudget > 0 ? Math.round((itemPrice / remainingBudget) * 100) : 999;
  
  // Risk Analysis
  let riskLevel = 'low';
  let recommendation = 'safe';
  
  if (priceToIncomeRatio > 50) {
    riskLevel = 'high';
    recommendation = 'not_recommended';
  } else if (priceToIncomeRatio > 30) {
    riskLevel = 'medium';
    recommendation = 'emi_suggested';
  } else if (itemPrice > remainingBudget) {
    riskLevel = 'medium';
    recommendation = 'wait';
  } else if (priceToRemainingRatio > 80) {
    riskLevel = 'medium';
    recommendation = 'caution';
  } else {
    riskLevel = 'low';
    recommendation = 'safe';
  }
  
  // EMI Calculation with No-Cost EMI option
  const emiOptions = [];
  if (itemPrice > 3000) {
    [3, 6, 9, 12].forEach(months => {
      const interestRate = months <= 6 ? 0 : 0.05; // No cost EMI for 6 months
      const monthlyEMI = Math.round((itemPrice / months) * (1 + interestRate));
      const totalPayable = monthlyEMI * months;
      const interestAmount = totalPayable - itemPrice;
      
      emiOptions.push({
        months,
        monthlyEMI,
        totalPayable,
        interestAmount,
        isNoCostEMI: interestRate === 0,
        affordability: monthlyEMI < (remainingBudget * 0.3) ? 'comfortable' : 
                       monthlyEMI < (remainingBudget * 0.5) ? 'manageable' : 'tight'
      });
    });
  }
  
  // Find upcoming sales for this category
  const today = new Date();
  const relevantSales = upcomingSales
    .filter(sale => {
      const saleStart = new Date(sale.startDate);
      const daysDiff = Math.ceil((saleStart - today) / (1000 * 60 * 60 * 24));
      return daysDiff > 0 && daysDiff <= 120 && sale.categories.includes(category);
    })
    .map(sale => {
      const saleStart = new Date(sale.startDate);
      const daysUntil = Math.ceil((saleStart - today) / (1000 * 60 * 60 * 24));
      return { ...sale, daysUntil };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 3);
  
  // Get applicable cashback offers
  const applicableOffers = cashbackOffers
    .filter(offer => offer.validCategories.includes(category))
    .map(offer => {
      const potentialCashback = typeof offer.maxCashback === 'number' 
        ? Math.min(itemPrice * (parseInt(offer.cashback) / 100), offer.maxCashback)
        : itemPrice * (parseInt(offer.cashback) / 100);
      return { ...offer, potentialSavings: Math.round(potentialCashback) };
    });
  
  // Get price trend for category
  const trend = priceTrends[category] || priceTrends.other;
  const currentMonth = today.toLocaleString('default', { month: 'long' });
  const isGoodMonth = trend.bestMonths.includes(currentMonth);
  const isBadMonth = trend.worstMonths.includes(currentMonth);
  
  // Generate AI Insights
  const insights = generateEnhancedInsights({
    itemName,
    itemPrice,
    category,
    urgency,
    monthlyIncome,
    totalExpense,
    remainingBudget,
    riskLevel,
    priceToIncomeRatio,
    priceToRemainingRatio,
    savingsGoal,
    relevantSales,
    isGoodMonth,
    isBadMonth,
    trend,
    applicableOffers
  });
  
  // Best Action Suggestion
  let bestAction = '';
  let actionType = 'neutral';
  
  if (recommendation === 'safe') {
    if (relevantSales.length > 0 && relevantSales[0].daysUntil <= 30 && urgency !== 'urgent') {
      const nextSale = relevantSales[0];
      const potentialSavings = Math.round(itemPrice * (parseInt(nextSale.discount) / 100) * 0.5);
      bestAction = `⏳ Wait ${nextSale.daysUntil} days for ${nextSale.name}! Potential savings: ₹${potentialSavings.toLocaleString('en-IN')}`;
      actionType = 'wait';
    } else {
      bestAction = `✅ Go ahead! You can afford this ${itemName} within your budget.`;
      actionType = 'buy';
    }
  } else if (recommendation === 'emi_suggested') {
    const bestEMI = emiOptions.find(e => e.affordability === 'comfortable' || e.affordability === 'manageable');
    if (bestEMI) {
      bestAction = `💳 Use ${bestEMI.months}-month ${bestEMI.isNoCostEMI ? 'No-Cost ' : ''}EMI at ₹${bestEMI.monthlyEMI.toLocaleString('en-IN')}/month`;
      actionType = 'emi';
    } else {
      bestAction = `⚠️ This purchase will significantly impact your budget. Consider saving first.`;
      actionType = 'caution';
    }
  } else if (recommendation === 'wait') {
    const daysToSave = Math.ceil((itemPrice - remainingBudget) / (monthlyIncome * 0.1));
    const dailySaving = Math.round((itemPrice - remainingBudget) / daysToSave);
    bestAction = `⏳ Save ₹${dailySaving.toLocaleString('en-IN')}/day for ${daysToSave} days to afford this purchase`;
    actionType = 'wait';
  } else if (recommendation === 'caution') {
    bestAction = `⚠️ This purchase will use ${priceToRemainingRatio}% of your remaining budget. Proceed with caution.`;
    actionType = 'caution';
  } else {
    bestAction = `🚫 This purchase is ${priceToIncomeRatio}% of your monthly income. Not recommended without EMI.`;
    actionType = 'avoid';
  }
  
  // Calculate potential total savings
  const bestCashback = applicableOffers.length > 0 ? Math.max(...applicableOffers.map(o => o.potentialSavings)) : 0;
  const saleSavings = relevantSales.length > 0 ? Math.round(itemPrice * 0.3) : 0; // Estimated 30% sale discount
  const totalPotentialSavings = bestCashback + saleSavings;

  res.status(200).json({
    success: true,
    data: {
      itemName,
      itemPrice,
      category,
      urgency,
      analysis: {
        monthlyIncome,
        totalExpense,
        remainingBudget,
        savingsGoal,
        affordabilityScore: Math.max(0, affordabilityScore),
        priceToIncomeRatio,
        priceToRemainingRatio,
        riskLevel,
        recommendation
      },
      emiOptions,
      upcomingSales: relevantSales,
      cashbackOffers: applicableOffers,
      priceTrend: {
        ...trend,
        currentMonth,
        isGoodMonth,
        isBadMonth
      },
      insights,
      bestAction,
      actionType,
      potentialSavings: totalPotentialSavings
    }
  });
});

// Enhanced Insights Generator
function generateEnhancedInsights(data) {
  const insights = [];
  
  // Budget Status
  const spendingRatio = data.monthlyIncome > 0 ? (data.totalExpense / data.monthlyIncome) * 100 : 0;
  if (spendingRatio > 80) {
    insights.push({
      type: 'warning',
      icon: '⚠️',
      title: 'High Spending Alert',
      message: `You've spent ${spendingRatio.toFixed(0)}% of your monthly income already`
    });
  } else if (spendingRatio < 50) {
    insights.push({
      type: 'success',
      icon: '✅',
      title: 'Good Budget Control',
      message: `You've only used ${spendingRatio.toFixed(0)}% of your income - well managed!`
    });
  }
  
  // Price Timing
  if (data.isGoodMonth) {
    insights.push({
      type: 'success',
      icon: '🎯',
      title: 'Good Time to Buy!',
      message: `${data.trend.tip}`
    });
  } else if (data.isBadMonth) {
    insights.push({
      type: 'warning',
      icon: '📅',
      title: 'Not the Best Time',
      message: `Prices for ${data.category} are typically higher this month. Best months: ${data.trend.bestMonths.join(', ')}`
    });
  }
  
  // Upcoming Sale
  if (data.relevantSales.length > 0 && data.urgency !== 'urgent') {
    const nextSale = data.relevantSales[0];
    insights.push({
      type: 'tip',
      icon: '🏷️',
      title: 'Upcoming Sale!',
      message: `${nextSale.name} starts in ${nextSale.daysUntil} days with ${nextSale.discount} off!`
    });
  }
  
  // Cashback Opportunity
  if (data.applicableOffers.length > 0) {
    const bestOffer = data.applicableOffers.reduce((a, b) => a.potentialSavings > b.potentialSavings ? a : b);
    insights.push({
      type: 'money',
      icon: '💳',
      title: 'Cashback Available',
      message: `Use ${bestOffer.method} to save up to ₹${bestOffer.potentialSavings.toLocaleString('en-IN')}`
    });
  }
  
  // Savings Impact
  if (data.savingsGoal > 0) {
    const savingsImpact = (data.itemPrice / data.savingsGoal) * 100;
    if (savingsImpact > 100) {
      insights.push({
        type: 'danger',
        icon: '🎯',
        title: 'Savings Goal Impact',
        message: `This purchase is ${savingsImpact.toFixed(0)}% of your monthly savings goal`
      });
    }
  }
  
  // Alternative suggestion for high-risk
  if (data.riskLevel === 'high') {
    insights.push({
      type: 'suggestion',
      icon: '💡',
      title: 'Smart Alternative',
      message: `Consider saving ₹${Math.round(data.itemPrice / 6).toLocaleString('en-IN')}/month for 6 months instead`
    });
  }
  
  // Urgency-based advice
  if (data.urgency === 'low' && data.relevantSales.length > 0) {
    insights.push({
      type: 'tip',
      icon: '⏰',
      title: 'Patience Pays',
      message: 'Since you can wait, consider waiting for the next sale for maximum savings'
    });
  }
  
  return insights;
}

// @desc    Get Financial Health Score - Enhanced
// @route   GET /api/advisor/health-score
// @access  Private
exports.getHealthScore = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  // Get current month data
  const startDate = new Date();
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date();
  
  const expenses = await Expense.getTotalByDateRange(
    req.user.id,
    startDate,
    endDate,
    'expense'
  );
  
  const income = await Expense.getTotalByDateRange(
    req.user.id,
    startDate,
    endDate,
    'income'
  );
  
  const totalExpense = expenses.total || 0;
  const totalIncomeThisMonth = income.total || 0;
  const monthlyIncome = user.monthlyIncome || totalIncomeThisMonth || 50000;
  const savingsGoal = user.savingsGoal || monthlyIncome * 0.2;
  
  // Calculate Health Score (0-100)
  let score = 50;
  
  // Savings Rate (30 points)
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - totalExpense) / monthlyIncome) * 100 : 0;
  if (savingsRate >= 30) score += 30;
  else if (savingsRate >= 20) score += 20;
  else if (savingsRate >= 10) score += 10;
  else if (savingsRate >= 0) score += 5;
  
  // Budget Control (20 points)
  const spendingRatio = monthlyIncome > 0 ? (totalExpense / monthlyIncome) * 100 : 100;
  if (spendingRatio < 60) score += 20;
  else if (spendingRatio < 70) score += 15;
  else if (spendingRatio < 80) score += 10;
  else if (spendingRatio < 90) score += 5;
  
  score = Math.min(100, Math.max(0, Math.round(score)));
  
  // Get category
  let category = 'Poor';
  let color = '#EF4444';
  let emoji = '😟';
  if (score >= 85) { category = 'Excellent'; color = '#10B981'; emoji = '🌟'; }
  else if (score >= 70) { category = 'Good'; color = '#3B82F6'; emoji = '😊'; }
  else if (score >= 50) { category = 'Fair'; color = '#F59E0B'; emoji = '😐'; }
  else { emoji = '😟'; }
  
  // Calculate available budget for purchases
  const availableBudget = Math.max(0, monthlyIncome - totalExpense - savingsGoal);

  res.status(200).json({
    success: true,
    data: {
      score,
      category,
      color,
      emoji,
      availableBudget,
      metrics: {
        savingsRate: Math.round(Math.max(0, savingsRate)),
        spendingRatio: Math.round(spendingRatio),
        monthlyIncome,
        totalExpense,
        actualSavings: Math.max(0, monthlyIncome - totalExpense),
        savingsGoal
      }
    }
  });
});

module.exports = exports;