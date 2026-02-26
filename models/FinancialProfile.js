// ==============================================
// FINANCIAL PROFILE MODEL
// ==============================================

const mongoose = require('mongoose');

const financialProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  monthlyIncome: {
    type: Number,
    required: [true, 'Monthly income is required'],
    min: [0, 'Income cannot be negative']
  },
  fixedExpenses: {
    type: Number,
    default: 0,
    min: [0, 'Fixed expenses cannot be negative']
  },
  savingsGoal: {
    amount: {
      type: Number,
      default: 0
    },
    targetDate: {
      type: Date
    },
    description: {
      type: String,
      maxlength: 200
    }
  },
  riskAppetite: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  investmentPreference: {
    type: [String],
    enum: ['stocks', 'mutual-funds', 'fixed-deposits', 'crypto', 'gold', 'real-estate'],
    default: []
  },
  debt: {
    totalAmount: {
      type: Number,
      default: 0
    },
    emi: {
      type: Number,
      default: 0
    },
    loanType: {
      type: String,
      enum: ['home-loan', 'car-loan', 'personal-loan', 'education-loan', 'credit-card', 'other'],
    },
    interestRate: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  emergencyFund: {
    currentAmount: {
      type: Number,
      default: 0
    },
    targetAmount: {
      type: Number,
      default: 0
    }
  },
  financialHealthScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  lastScoreUpdate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ==============================================
// INDEXES
// ==============================================

financialProfileSchema.index({ user: 1 });

// ==============================================
// VIRTUAL FIELDS
// ==============================================

// Calculate disposable income
financialProfileSchema.virtual('disposableIncome').get(function() {
  return this.monthlyIncome - this.fixedExpenses - this.debt.emi;
});

// Calculate debt-to-income ratio
financialProfileSchema.virtual('debtToIncomeRatio').get(function() {
  if (this.monthlyIncome === 0) return 0;
  return ((this.debt.emi / this.monthlyIncome) * 100).toFixed(2);
});

// ==============================================
// METHODS
// ==============================================

// Calculate financial health score
financialProfileSchema.methods.calculateHealthScore = function() {
  let score = 0;

  // 1. Savings Rate (40 points)
  const savingsRate = ((this.monthlyIncome - this.fixedExpenses) / this.monthlyIncome) * 100;
  if (savingsRate >= 30) score += 40;
  else if (savingsRate >= 20) score += 30;
  else if (savingsRate >= 10) score += 20;
  else if (savingsRate >= 5) score += 10;

  // 2. Debt Ratio (30 points)
  const debtRatio = this.debt.emi / this.monthlyIncome;
  if (debtRatio < 0.2) score += 30;
  else if (debtRatio < 0.4) score += 20;
  else if (debtRatio < 0.5) score += 10;

  // 3. Emergency Fund (30 points)
  const monthsOfExpenses = this.emergencyFund.currentAmount / this.fixedExpenses;
  if (monthsOfExpenses >= 6) score += 30;
  else if (monthsOfExpenses >= 3) score += 20;
  else if (monthsOfExpenses >= 1) score += 10;

  this.financialHealthScore = Math.round(score);
  this.lastScoreUpdate = Date.now();
  
  return this.financialHealthScore;
};

// Get health status
financialProfileSchema.methods.getHealthStatus = function() {
  if (this.financialHealthScore >= 85) return 'Excellent';
  if (this.financialHealthScore >= 70) return 'Good';
  if (this.financialHealthScore >= 50) return 'Fair';
  if (this.financialHealthScore >= 30) return 'Poor';
  return 'Critical';
};

// Enable virtuals in JSON
financialProfileSchema.set('toJSON', { virtuals: true });
financialProfileSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('FinancialProfile', financialProfileSchema);