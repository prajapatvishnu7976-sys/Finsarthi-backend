// ==============================================
// INSIGHT GENERATOR
// ==============================================

/**
 * Generate personalized financial insights
 */

function generateInsights(userData) {
  const insights = [];

  const {
    profile,
    currentMonthExpenses,
    lastMonthExpenses,
    categoryData,
    budgets
  } = userData;

  // 1. Spending Comparison
  if (lastMonthExpenses > 0) {
    const change = ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;
    
    if (change > 15) {
      insights.push({
        type: 'warning',
        category: 'Spending',
        title: 'Increased Spending Alert',
        message: `Your spending increased by ${change.toFixed(2)}% compared to last month`,
        icon: '📈',
        priority: 'high'
      });
    } else if (change < -15) {
      insights.push({
        type: 'success',
        category: 'Spending',
        title: 'Great Savings!',
        message: `You reduced spending by ${Math.abs(change).toFixed(2)}% compared to last month`,
        icon: '🎉',
        priority: 'low'
      });
    }
  }

  // 2. Top Spending Category
  if (categoryData && categoryData.length > 0) {
    const topCategory = categoryData[0];
    const percentage = (topCategory.total / currentMonthExpenses * 100).toFixed(2);
    
    if (percentage > 30) {
      insights.push({
        type: 'info',
        category: 'Categories',
        title: 'High Category Spending',
        message: `${percentage}% of your spending is on ${topCategory.category}`,
        icon: topCategory.icon,
        priority: 'medium'
      });
    }
  }

  // 3. Budget Status
  if (budgets) {
    const exceededBudgets = budgets.filter(b => b.isExceeded);
    const warningBudgets = budgets.filter(b => b.status === 'warning');

    if (exceededBudgets.length > 0) {
      insights.push({
        type: 'warning',
        category: 'Budget',
        title: 'Budget Exceeded',
        message: `You've exceeded ${exceededBudgets.length} budget(s) this month`,
        icon: '⚠️',
        priority: 'high'
      });
    } else if (warningBudgets.length > 0) {
      insights.push({
        type: 'warning',
        category: 'Budget',
        title: 'Budget Warning',
        message: `${warningBudgets.length} budget(s) are nearing their limit`,
        icon: '⚡',
        priority: 'medium'
      });
    }
  }

  // 4. Savings Rate
  if (profile) {
    const savingsRate = ((profile.monthlyIncome - currentMonthExpenses) / profile.monthlyIncome * 100);
    
    if (savingsRate < 10) {
      insights.push({
        type: 'warning',
        category: 'Savings',
        title: 'Low Savings Rate',
        message: `You're saving only ${savingsRate.toFixed(2)}% of your income`,
        icon: '💰',
        priority: 'high'
      });
    } else if (savingsRate > 30) {
      insights.push({
        type: 'success',
        category: 'Savings',
        title: 'Excellent Savings!',
        message: `You're saving ${savingsRate.toFixed(2)}% of your income`,
        icon: '🌟',
        priority: 'low'
      });
    }
  }

  // 5. Emergency Fund
  if (profile && profile.emergencyFund) {
    const monthsOfExpenses = profile.emergencyFund.currentAmount / profile.fixedExpenses;
    
    if (monthsOfExpenses < 3) {
      insights.push({
        type: 'info',
        category: 'Emergency Fund',
        title: 'Build Emergency Fund',
        message: `You have ${monthsOfExpenses.toFixed(1)} months of expenses saved. Aim for 6 months.`,
        icon: '🏦',
        priority: 'medium'
      });
    }
  }

  return insights.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

module.exports = {
  generateInsights
};