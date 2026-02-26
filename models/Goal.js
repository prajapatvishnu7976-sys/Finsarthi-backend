// ==============================================
// FINANCIAL GOAL MODEL - FUTURE PLANNER
// ==============================================

const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Goal name is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['Car', 'House', 'Wedding', 'Education', 'Vacation', 'Emergency Fund', 'Retirement', 'Business', 'Other'],
    default: 'Other'
  },
  targetAmount: {
    type: Number,
    required: [true, 'Target amount is required'],
    min: [1, 'Target amount must be greater than 0']
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  timelineMonths: {
    type: Number,
    required: [true, 'Timeline is required'],
    min: 1
  },
  targetDate: Date,
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Paused', 'Cancelled'],
    default: 'Active'
  },
  
  // AI Recommendations
  aiRecommendations: {
    monthlySavingRequired: Number,
    isAchievable: Boolean,
    riskLevel: String,
    bestPurchaseTime: String, // "Wait for Diwali sale"
    alternativeOptions: [String],
    productLinks: [{
      platform: String,
      url: String,
      price: Number,
      discount: Number
    }],
    savingTips: [String],
    generatedAt: Date
  },
  
  // Progress tracking
  milestones: [{
    percentage: Number,
    amount: Number,
    achievedAt: Date,
    reward: String
  }],
  
  contributions: [{
    amount: Number,
    date: Date,
    source: String, // 'manual', 'auto-save', 'bonus'
  }],
  
  notes: String,
  isAutoSave: {
    type: Boolean,
    default: false
  },
  autoSaveAmount: Number,
  
  completedAt: Date,
  
}, {
  timestamps: true
});

// Indexes
goalSchema.index({ user: 1, status: 1 });
goalSchema.index({ user: 1, targetDate: 1 });

// Calculate progress percentage
goalSchema.virtual('progress').get(function() {
  if (this.targetAmount === 0) return 0;
  return Math.min(100, Math.round((this.currentAmount / this.targetAmount) * 100));
});

// Calculate remaining amount
goalSchema.virtual('remainingAmount').get(function() {
  return Math.max(0, this.targetAmount - this.currentAmount);
});

// Calculate months remaining
goalSchema.virtual('monthsRemaining').get(function() {
  if (!this.targetDate) return this.timelineMonths;
  const now = new Date();
  const target = new Date(this.targetDate);
  const monthsDiff = (target.getFullYear() - now.getFullYear()) * 12 + 
                     (target.getMonth() - now.getMonth());
  return Math.max(0, monthsDiff);
});

// Set target date based on timeline
goalSchema.pre('save', function(next) {
  if (!this.targetDate && this.timelineMonths) {
    const date = new Date();
    date.setMonth(date.getMonth() + this.timelineMonths);
    this.targetDate = date;
  }
  next();
});

// Check if goal is completed
goalSchema.pre('save', function(next) {
  if (this.currentAmount >= this.targetAmount && this.status === 'Active') {
    this.status = 'Completed';
    this.completedAt = new Date();
  }
  next();
});

// Static method: Get active goals
goalSchema.statics.getActiveGoals = async function(userId) {
  return await this.find({ user: userId, status: 'Active' })
    .sort({ priority: 1, targetDate: 1 });
};

// Instance method: Add contribution
goalSchema.methods.addContribution = function(amount, source = 'manual') {
  this.currentAmount += amount;
  this.contributions.push({
    amount,
    date: new Date(),
    source
  });
  
  // Check milestones
  const progress = (this.currentAmount / this.targetAmount) * 100;
  const milestones = [25, 50, 75, 100];
  
  milestones.forEach(percentage => {
    if (progress >= percentage && !this.milestones.find(m => m.percentage === percentage)) {
      this.milestones.push({
        percentage,
        amount: (this.targetAmount * percentage) / 100,
        achievedAt: new Date(),
        reward: `🎉 ${percentage}% milestone achieved!`
      });
    }
  });
  
  return this.save();
};

// Enable virtuals
goalSchema.set('toJSON', { virtuals: true });
goalSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Goal', goalSchema);