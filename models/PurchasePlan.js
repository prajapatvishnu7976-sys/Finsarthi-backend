// ==============================================
// PURCHASE PLAN MODEL
// ==============================================

const mongoose = require('mongoose');

const purchasePlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  itemName: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [100, 'Item name cannot exceed 100 characters']
  },
  targetAmount: {
    type: Number,
    required: [true, 'Target amount is required'],
    min: [1, 'Target amount must be greater than 0']
  },
  currentSaved: {
    type: Number,
    default: 0,
    min: 0
  },
  targetDate: {
    type: Date,
    required: [true, 'Target date is required']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['electronics', 'vehicle', 'property', 'education', 'travel', 'other'],
    default: 'other'
  },
  description: {
    type: String,
    maxlength: 500
  },
  imageUrl: {
    type: String
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  emiOptions: [{
    months: Number,
    monthlyPayment: Number,
    totalInterest: Number,
    totalAmount: Number
  }],
  recommendations: {
    canAfford: Boolean,
    bestOption: String,
    riskLevel: String,
    suggestedWaitTime: Number,
    impactOnSavings: Number
  }
}, {
  timestamps: true
});

// ==============================================
// INDEXES
// ==============================================

purchasePlanSchema.index({ user: 1, isCompleted: 1 });
purchasePlanSchema.index({ user: 1, targetDate: 1 });

// ==============================================
// VIRTUAL FIELDS
// ==============================================

purchasePlanSchema.virtual('remainingAmount').get(function() {
  return Math.max(0, this.targetAmount - this.currentSaved);
});

purchasePlanSchema.virtual('progressPercentage').get(function() {
  return ((this.currentSaved / this.targetAmount) * 100).toFixed(2);
});

purchasePlanSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const diff = this.targetDate - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// ==============================================
// METHODS
// ==============================================

// Calculate EMI options
purchasePlanSchema.methods.calculateEMI = function(interestRate = 10) {
  const principal = this.targetAmount;
  const emiOptions = [];

  [6, 12, 18, 24, 36].forEach(months => {
    const monthlyRate = interestRate / 12 / 100;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                (Math.pow(1 + monthlyRate, months) - 1);
    
    const totalAmount = emi * months;
    const totalInterest = totalAmount - principal;

    emiOptions.push({
      months,
      monthlyPayment: Math.round(emi),
      totalInterest: Math.round(totalInterest),
      totalAmount: Math.round(totalAmount)
    });
  });

  this.emiOptions = emiOptions;
  return emiOptions;
};

// Generate recommendations
purchasePlanSchema.methods.generateRecommendations = async function() {
  const FinancialProfile = mongoose.model('FinancialProfile');
  const profile = await FinancialProfile.findOne({ user: this.user });

  if (!profile) {
    this.recommendations = {
      canAfford: false,
      bestOption: 'Complete financial profile first',
      riskLevel: 'unknown'
    };
    return this.recommendations;
  }

  const disposableIncome = profile.monthlyIncome - profile.fixedExpenses - profile.debt.emi;
  const monthsToSave = Math.ceil(this.remainingAmount / (disposableIncome * 0.3));

  this.recommendations = {
    canAfford: disposableIncome > 0,
    bestOption: monthsToSave <= 6 ? 'Save and buy' : 'Consider EMI',
    riskLevel: this.targetAmount > disposableIncome * 12 ? 'high' : 'medium',
    suggestedWaitTime: monthsToSave,
    impactOnSavings: ((this.targetAmount / profile.monthlyIncome) * 100).toFixed(2)
  };

  return this.recommendations;
};

// Enable virtuals in JSON
purchasePlanSchema.set('toJSON', { virtuals: true });
purchasePlanSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('PurchasePlan', purchasePlanSchema);