// ==============================================
// ANALYTICS CONTROLLER - FIXED
// ==============================================

const Expense = require('../models/Expense');
const User = require('../models/User');
const Budget = require('../models/Budget');
const { asyncHandler } = require('../middleware/errorMiddleware');

// ==============================================
// @desc    Get Dashboard Analytics
// @route   GET /api/analytics/dashboard
// @access  Private
// ==============================================

exports.getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId);
  
  // Current month date range
  const startDate = new Date();
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(0);
  endDate.setHours(23, 59, 59, 999);
  
  // Get totals
  const expenseData = await Expense.getTotalByDateRange(userId, startDate, endDate, 'expense');
  const incomeData = await Expense.getTotalByDateRange(userId, startDate, endDate, 'income');
  
  const totalExpense = expenseData.total || 0;
  const totalIncome = incomeData.total || user?.monthlyIncome || 0;
  const savings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((savings / totalIncome) * 100).toFixed(1) : 0;
  
  // Category breakdown - Fixed query
  const categoryBreakdown = await Expense.aggregate([
    {
      $match: {
        user: req.user._id,
        type: 'expense',
        date: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { total: -1 }
    }
  ]);
  
  // Format for pie chart
  const categoryData = categoryBreakdown.map(cat => ({
    name: cat._id,
    value: cat.total,
    count: cat.count
  }));

  // Debug log
  console.log('📊 Dashboard - Categories:', categoryData);

  res.status(200).json({
    success: true,
    data: {
      totalIncome,
      totalExpense,
      savings,
      savingsRate: parseFloat(savingsRate),
      categoryBreakdown: categoryData
    }
  });
});

// ==============================================
// @desc    Get Monthly Trends
// @route   GET /api/analytics/trends
// @access  Private
// ==============================================

exports.getMonthlyTrends = asyncHandler(async (req, res) => {
  const { months = 6 } = req.query;
  const userId = req.user.id;

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - parseInt(months));
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const trends = await Expense.aggregate([
    {
      $match: {
        user: req.user._id,
        date: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          type: '$type'
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  // Format for chart
  const chartData = {};
  
  trends.forEach(item => {
    const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
    
    if (!chartData[key]) {
      chartData[key] = {
        month: key,
        income: 0,
        expense: 0
      };
    }
    
    if (item._id.type === 'income') {
      chartData[key].income = item.total;
    } else {
      chartData[key].expense = item.total;
    }
  });

  const formattedData = Object.values(chartData).map(item => ({
    ...item,
    savings: item.income - item.expense
  }));

  res.status(200).json({
    success: true,
    data: formattedData
  });
});

// ==============================================
// @desc    Get Spending Insights
// @route   GET /api/analytics/insights
// @access  Private
// ==============================================

exports.getInsights = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId);
  
  // Current month
  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);
  
  const currentMonthEnd = new Date();
  
  // Previous month
  const prevMonthStart = new Date();
  prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
  prevMonthStart.setDate(1);
  prevMonthStart.setHours(0, 0, 0, 0);
  
  const prevMonthEnd = new Date(currentMonthStart);
  prevMonthEnd.setDate(0);
  prevMonthEnd.setHours(23, 59, 59, 999);
  
  // Get current month expenses
  const currentExpenses = await Expense.aggregate([
    {
      $match: {
        user: req.user._id,
        type: 'expense',
        date: { $gte: currentMonthStart, $lte: currentMonthEnd }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);
  
  const currentTotal = currentExpenses[0]?.total || 0;
  
  // Get previous month expenses
  const prevExpenses = await Expense.aggregate([
    {
      $match: {
        user: req.user._id,
        type: 'expense',
        date: { $gte: prevMonthStart, $lte: prevMonthEnd }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);
  
  const prevTotal = prevExpenses[0]?.total || 0;
  
  // Current month by category
  const currentCategories = await Expense.aggregate([
    {
      $match: {
        user: req.user._id,
        type: 'expense',
        date: { $gte: currentMonthStart, $lte: currentMonthEnd }
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' }
      }
    },
    { $sort: { total: -1 } }
  ]);
  
  // Previous month by category
  const prevCategories = await Expense.aggregate([
    {
      $match: {
        user: req.user._id,
        type: 'expense',
        date: { $gte: prevMonthStart, $lte: prevMonthEnd }
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' }
      }
    }
  ]);
  
  const insights = [];
  
  // Overall spending comparison
  const expenseChange = currentTotal - prevTotal;
  const expenseChangePercent = prevTotal > 0 
    ? ((expenseChange / prevTotal) * 100).toFixed(1)
    : 0;
  
  if (expenseChange > 0) {
    insights.push({
      type: 'warning',
      icon: '📈',
      title: 'Increased Spending',
      message: `You spent ₹${Math.abs(expenseChange).toLocaleString('en-IN')} (${Math.abs(expenseChangePercent)}%) more than last month`,
      recommendation: 'Review your discretionary expenses'
    });
  } else if (expenseChange < 0) {
    insights.push({
      type: 'success',
      icon: '📉',
      title: 'Great Progress!',
      message: `You saved ₹${Math.abs(expenseChange).toLocaleString('en-IN')} (${Math.abs(expenseChangePercent)}%) compared to last month`,
      recommendation: 'Keep up the good work!'
    });
  }
  
  // Category-wise insights
  currentCategories.forEach(currentCat => {
    const prevCat = prevCategories.find(c => c._id === currentCat._id);
    
    if (prevCat) {
      const catChange = currentCat.total - prevCat.total;
      const catChangePercent = ((catChange / prevCat.total) * 100).toFixed(1);
      
      if (catChangePercent > 30) {
        insights.push({
          type: 'alert',
          icon: '⚠️',
          title: `High ${currentCat._id} Spending`,
          message: `${currentCat._id} expenses increased by ${catChangePercent}%`,
          recommendation: `Try to reduce ${currentCat._id} spending`
        });
      }
    }
  });
  
  // Top spending category insight
  if (currentCategories.length > 0) {
    const topCategory = currentCategories[0];
    insights.push({
      type: 'info',
      icon: '💰',
      title: 'Top Spending Category',
      message: `${topCategory._id}: ₹${topCategory.total.toLocaleString('en-IN')}`,
      recommendation: 'Consider setting a budget for this category'
    });
  }
  
  // Savings insights
  const monthlyIncome = user?.monthlyIncome || 0;
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - currentTotal) / monthlyIncome) * 100 : 0;
  
  if (monthlyIncome > 0) {
    if (savingsRate < 20) {
      insights.push({
        type: 'warning',
        icon: '💡',
        title: 'Low Savings Rate',
        message: `Current savings rate: ${savingsRate.toFixed(1)}%`,
        recommendation: 'Aim for at least 20% savings rate'
      });
    } else {
      insights.push({
        type: 'success',
        icon: '🎉',
        title: 'Good Savings Rate!',
        message: `Current savings rate: ${savingsRate.toFixed(1)}%`,
        recommendation: 'You are on track with your savings!'
      });
    }
  }

  res.status(200).json({
    success: true,
    count: insights.length,
    data: insights
  });
});

module.exports = exports;