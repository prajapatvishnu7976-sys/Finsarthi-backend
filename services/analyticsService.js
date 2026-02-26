// ==============================================
// ANALYTICS SERVICE
// ==============================================

const Expense = require('../models/Expense');

// ==============================================
// Detect Unusual Spending
// ==============================================

async function detectUnusualSpending(userId) {
  const last3Months = new Date();
  last3Months.setMonth(last3Months.getMonth() - 3);

  // Calculate average and standard deviation
  const stats = await Expense.aggregate([
    {
      $match: {
        user: userId,
        type: 'expense',
        date: { $gte: last3Months }
      }
    },
    {
      $group: {
        _id: null,
        avg: { $avg: '$amount' },
        stdDev: { $stdDevPop: '$amount' }
      }
    }
  ]);

  if (stats.length === 0) return [];

  const { avg, stdDev } = stats[0];
  const threshold = avg + (2 * stdDev); // 2 standard deviations above mean

  // Find unusual expenses
  const unusualExpenses = await Expense.find({
    user: userId,
    type: 'expense',
    amount: { $gt: threshold },
    date: { $gte: last3Months }
  })
    .populate('category', 'name icon')
    .sort({ amount: -1 })
    .limit(10);

  return unusualExpenses;
}

// ==============================================
// Predict Next Month Expenses
// ==============================================

async function predictNextMonthExpenses(userId) {
  const last6Months = await Expense.getMonthlyTrend(userId, 6);

  const expenseData = last6Months.filter(m => m._id.type === 'expense');

  if (expenseData.length === 0) return 0;

  // Simple moving average
  const total = expenseData.reduce((sum, m) => sum + m.total, 0);
  const average = total / expenseData.length;

  // Add 5% buffer for variability
  const prediction = average * 1.05;

  return Math.round(prediction);
}

// ==============================================
// Get Spending Trends
// ==============================================

async function getSpendingTrends(userId, months = 6) {
  const trends = await Expense.getMonthlyTrend(userId, months);

  const expenseTrend = trends.filter(t => t._id.type === 'expense');
  const incomeTrend = trends.filter(t => t._id.type === 'income');

  return {
    expenses: expenseTrend,
    income: incomeTrend,
    trend: calculateTrend(expenseTrend)
  };
}

// ==============================================
// Calculate Trend (Increasing/Decreasing)
// ==============================================

function calculateTrend(data) {
  if (data.length < 2) return 'stable';

  const recent = data.slice(-3);
  const older = data.slice(0, -3);

  const recentAvg = recent.reduce((sum, m) => sum + m.total, 0) / recent.length;
  const olderAvg = older.length > 0 
    ? older.reduce((sum, m) => sum + m.total, 0) / older.length
    : recentAvg;

  const change = ((recentAvg - olderAvg) / olderAvg * 100);

  if (change > 10) return 'increasing';
  if (change < -10) return 'decreasing';
  return 'stable';
}

module.exports = {
  detectUnusualSpending,
  predictNextMonthExpenses,
  getSpendingTrends
};