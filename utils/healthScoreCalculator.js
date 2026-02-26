// ==============================================
// FINANCIAL HEALTH SCORE CALCULATOR
// ==============================================

/**
 * Calculate Financial Health Score (0-100)
 * @param {Object} profile - User's financial profile
 * @param {Number} currentExpenses - Current month expenses
 * @returns {Object} - Score and breakdown
 */

function calculateDetailedHealthScore(profile, currentExpenses = 0) {
  let score = 0;
  const breakdown = {};

  // 1. SAVINGS RATE (40 points)
  const income = profile.monthlyIncome || 0;
  const expenses = currentExpenses || profile.fixedExpenses || 0;
  const savingsAmount = income - expenses;
  const savingsRate = income > 0 ? (savingsAmount / income) * 100 : 0;

  if (savingsRate >= 30) {
    score += 40;
    breakdown.savingsRate = { score: 40, status: 'Excellent' };
  } else if (savingsRate >= 20) {
    score += 30;
    breakdown.savingsRate = { score: 30, status: 'Good' };
  } else if (savingsRate >= 10) {
    score += 20;
    breakdown.savingsRate = { score: 20, status: 'Fair' };
  } else if (savingsRate >= 5) {
    score += 10;
    breakdown.savingsRate = { score: 10, status: 'Poor' };
  } else {
    breakdown.savingsRate = { score: 0, status: 'Critical' };
  }

  // 2. DEBT-TO-INCOME RATIO (30 points)
  const debtRatio = income > 0 ? (profile.debt?.emi || 0) / income : 0;

  if (debtRatio < 0.2) {
    score += 30;
    breakdown.debtRatio = { score: 30, status: 'Excellent' };
  } else if (debtRatio < 0.3) {
    score += 20;
    breakdown.debtRatio = { score: 20, status: 'Good' };
  } else if (debtRatio < 0.4) {
    score += 10;
    breakdown.debtRatio = { score: 10, status: 'Fair' };
  } else if (debtRatio < 0.5) {
    score += 5;
    breakdown.debtRatio = { score: 5, status: 'Poor' };
  } else {
    breakdown.debtRatio = { score: 0, status: 'Critical' };
  }

  // 3. EMERGENCY FUND (30 points)
  const emergencyFund = profile.emergencyFund?.currentAmount || 0;
  const monthlyExpenses = profile.fixedExpenses || 0;
  const monthsOfExpenses = monthlyExpenses > 0 ? emergencyFund / monthlyExpenses : 0;

  if (monthsOfExpenses >= 6) {
    score += 30;
    breakdown.emergencyFund = { score: 30, status: 'Excellent' };
  } else if (monthsOfExpenses >= 3) {
    score += 20;
    breakdown.emergencyFund = { score: 20, status: 'Good' };
  } else if (monthsOfExpenses >= 1) {
    score += 10;
    breakdown.emergencyFund = { score: 10, status: 'Fair' };
  } else if (monthsOfExpenses >= 0.5) {
    score += 5;
    breakdown.emergencyFund = { score: 5, status: 'Poor' };
  } else {
    breakdown.emergencyFund = { score: 0, status: 'Critical' };
  }

  // Overall status
  let overallStatus;
  if (score >= 85) overallStatus = 'Excellent';
  else if (score >= 70) overallStatus = 'Good';
  else if (score >= 50) overallStatus = 'Fair';
  else if (score >= 30) overallStatus = 'Poor';
  else overallStatus = 'Critical';

  return {
    score: Math.round(score),
    status: overallStatus,
    breakdown,
    metrics: {
      savingsRate: savingsRate.toFixed(2),
      debtRatio: (debtRatio * 100).toFixed(2),
      emergencyFundMonths: monthsOfExpenses.toFixed(1)
    }
  };
}

module.exports = {
  calculateDetailedHealthScore
};