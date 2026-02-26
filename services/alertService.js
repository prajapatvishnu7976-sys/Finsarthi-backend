// ==============================================
// ALERT SERVICE (Background Jobs)
// ==============================================

const cron = require('node-cron');
const Budget = require('../models/Budget');
const FinancialProfile = require('../models/FinancialProfile');
const Expense = require('../models/Expense');
const Alert = require('../models/Alert');

// ==============================================
// Check Budget Alerts (Daily at 9 AM)
// ==============================================

const checkBudgetAlerts = cron.schedule('0 9 * * *', async () => {
  console.log('🔔 Running budget alert check...');

  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Get all budgets for current month
    const budgets = await Budget.find({ month, year }).populate('user category');

    for (let budget of budgets) {
      await budget.updateSpentAmount();

      // Send warning alert
      if (budget.shouldSendAlert()) {
        await Alert.createAlert(
          budget.user._id,
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
      }

      // Send exceeded alert
      if (budget.isExceeded && !budget.isAlertSent) {
        await Alert.createAlert(
          budget.user._id,
          'budget_exceeded',
          `Budget Exceeded: ${budget.category.name}`,
          `Your budget has been exceeded by ₹${budget.spentAmount - budget.limitAmount}`,
          {
            severity: 'critical',
            metadata: { budgetId: budget._id }
          }
        );
      }
    }

    console.log('✅ Budget alerts checked');
  } catch (error) {
    console.error('❌ Budget alert error:', error);
  }
});

// ==============================================
// Monthly Financial Report (1st of every month)
// ==============================================

const sendMonthlyReport = cron.schedule('0 10 1 * *', async () => {
  console.log('📊 Generating monthly reports...');

  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const profiles = await FinancialProfile.find({});

    for (let profile of profiles) {
      const expenses = await Expense.getTotalByDateRange(
        profile.user,
        lastMonth,
        lastMonthEnd,
        'expense'
      );

      const income = await Expense.getTotalByDateRange(
        profile.user,
        lastMonth,
        lastMonthEnd,
        'income'
      );

      const savings = income - expenses;
      const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(2) : 0;

      await Alert.createAlert(
        profile.user,
        'monthly_report',
        'Your Monthly Financial Report',
        `Last month: Income ₹${income}, Expenses ₹${expenses}, Savings ₹${savings} (${savingsRate}%)`,
        {
          severity: 'info',
          metadata: { income, expenses, savings, savingsRate }
        }
      );
    }

    console.log('✅ Monthly reports sent');
  } catch (error) {
    console.error('❌ Monthly report error:', error);
  }
});

// ==============================================
// Check Savings Goal Progress (Weekly)
// ==============================================

const checkSavingsGoals = cron.schedule('0 10 * * 1', async () => {
  console.log('💰 Checking savings goals...');

  try {
    const profiles = await FinancialProfile.find({
      'savingsGoal.amount': { $gt: 0 }
    });

    for (let profile of profiles) {
      const progress = (profile.emergencyFund.currentAmount / profile.savingsGoal.amount * 100).toFixed(2);

      if (progress >= 100) {
        await Alert.createAlert(
          profile.user,
          'savings_goal_achieved',
          'Savings Goal Achieved! 🎉',
          `Congratulations! You've reached your savings goal of ₹${profile.savingsGoal.amount}`,
          {
            severity: 'success'
          }
        );
      } else if (profile.savingsGoal.targetDate) {
        const daysLeft = Math.ceil((new Date(profile.savingsGoal.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
        
        if (daysLeft <= 30 && progress < 80) {
          await Alert.createAlert(
            profile.user,
            'savings_goal_missed',
            'Savings Goal Alert',
            `Only ${daysLeft} days left! You're at ${progress}% of your goal. Consider increasing monthly savings.`,
            {
              severity: 'warning'
            }
          );
        }
      }
    }

    console.log('✅ Savings goals checked');
  } catch (error) {
    console.error('❌ Savings goal error:', error);
  }
});

// ==============================================
// Start All Scheduled Jobs
// ==============================================

function startScheduledJobs() {
  checkBudgetAlerts.start();
  sendMonthlyReport.start();
  checkSavingsGoals.start();
  
  console.log('✅ All scheduled jobs started');
}

// ==============================================
// Stop All Jobs (for graceful shutdown)
// ==============================================

function stopScheduledJobs() {
  checkBudgetAlerts.stop();
  sendMonthlyReport.stop();
  checkSavingsGoals.stop();
  
  console.log('🛑 All scheduled jobs stopped');
}

module.exports = {
  startScheduledJobs,
  stopScheduledJobs
};