// ==============================================
// BUDGET MODEL - FINSARTHI
// ==============================================

const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Food & Dining',
      'Transportation',
      'Shopping',
      'Entertainment',
      'Bills & Utilities',
      'Healthcare',
      'Education',
      'Travel',
      'Rent',
      'EMI',
      'Insurance',
      'Other'
    ]
  },
  limit: {
    type: Number,
    required: [true, 'Budget limit is required'],
    min: [1, 'Budget limit must be at least 1']
  },
  spent: {
    type: Number,
    default: 0,
    min: 0
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  alertThreshold: {
    type: Number,
    default: 80, // Alert when 80% spent
    min: 50,
    max: 100
  },
  alertSent: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    maxlength: 200
  }
}, {
  timestamps: true
});

// ==============================================
// INDEXES
// ==============================================

budgetSchema.index({ user: 1, month: 1, year: 1 });
budgetSchema.index({ user: 1, category: 1, month: 1, year: 1 }, { unique: true });

// ==============================================
// VIRTUAL FIELDS
// ==============================================

budgetSchema.virtual('remaining').get(function() {
  return Math.max(0, this.limit - this.spent);
});

budgetSchema.virtual('percentage').get(function() {
  if (this.limit === 0) return 0;
  return Math.round((this.spent / this.limit) * 100);
});

budgetSchema.virtual('status').get(function() {
  const percentage = this.percentage;
  if (percentage >= 100) return 'exceeded';
  if (percentage >= this.alertThreshold) return 'warning';
  if (percentage >= 50) return 'moderate';
  return 'good';
});

// ==============================================
// STATIC METHODS
// ==============================================

// Get all budgets for a month
budgetSchema.statics.getMonthlyBudgets = async function(userId, month, year) {
  return await this.find({
    user: userId,
    month: month,
    year: year,
    isActive: true
  }).sort({ category: 1 });
};

// Get budget summary
budgetSchema.statics.getBudgetSummary = async function(userId, month, year) {
  const budgets = await this.find({
    user: userId,
    month: month,
    year: year,
    isActive: true
  });

  const totalLimit = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const exceededCount = budgets.filter(b => b.spent > b.limit).length;
  const warningCount = budgets.filter(b => {
    const pct = (b.spent / b.limit) * 100;
    return pct >= b.alertThreshold && pct < 100;
  }).length;

  return {
    totalBudgets: budgets.length,
    totalLimit,
    totalSpent,
    remaining: totalLimit - totalSpent,
    percentage: totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0,
    exceededCount,
    warningCount,
    healthyCount: budgets.length - exceededCount - warningCount
  };
};

// Update spent amount
budgetSchema.statics.updateSpent = async function(userId, category, month, year) {
  const Expense = mongoose.model('Expense');
  
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const result = await Expense.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        category: category,
        type: 'expense',
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  const spent = result.length > 0 ? result[0].total : 0;

  await this.findOneAndUpdate(
    { user: userId, category, month, year },
    { spent },
    { new: true }
  );

  return spent;
};

// ==============================================
// INSTANCE METHODS
// ==============================================

budgetSchema.methods.shouldAlert = function() {
  return this.percentage >= this.alertThreshold && !this.alertSent;
};

// Enable virtuals
budgetSchema.set('toJSON', { virtuals: true });
budgetSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Budget', budgetSchema);