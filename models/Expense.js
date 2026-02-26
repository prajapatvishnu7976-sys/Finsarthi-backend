// ==============================================
// EXPENSE MODEL - FINSARTHI
// ==============================================

const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
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
      'Investments',
      'Salary',
      'Freelance',
      'Business',
      'Rent',
      'EMI',
      'Insurance',
      'Gifts',
      'Other'
    ]
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['expense', 'income'],
    default: 'expense'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'net-banking', 'wallet', 'other'],
    default: 'upi'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPeriod: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: function() {
      return this.isRecurring;
    }
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  receipt: {
    type: String
  },
  notes: {
    type: String,
    maxlength: 500
  },
  
  // AI detected category confidence
  aiDetected: {
    type: Boolean,
    default: false
  },
  aiConfidence: {
    type: Number,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// ==============================================
// INDEXES (Optimized for queries)
// ==============================================

expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1 });
expenseSchema.index({ user: 1, type: 1, date: -1 });
expenseSchema.index({ user: 1, createdAt: -1 });

// ==============================================
// VIRTUAL FIELDS
// ==============================================

expenseSchema.virtual('month').get(function() {
  return this.date.getMonth() + 1;
});

expenseSchema.virtual('year').get(function() {
  return this.date.getFullYear();
});

expenseSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(this.amount);
});

// ==============================================
// STATIC METHODS
// ==============================================

// Get total by date range
expenseSchema.statics.getTotalByDateRange = async function(userId, startDate, endDate, type = 'expense') {
  const result = await this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        type: type,
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  return result.length > 0 ? result[0] : { total: 0, count: 0 };
};

// Get expenses by category (for pie chart)
expenseSchema.statics.getByCategory = async function(userId, startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        type: 'expense',
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
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
      $project: {
        category: '$_id',
        total: 1,
        count: 1,
        _id: 0
      }
    },
    {
      $sort: { total: -1 }
    }
  ]);
};

// Get monthly trend (for line chart)
expenseSchema.statics.getMonthlyTrend = async function(userId, months = 6) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  return await this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
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
};

// Get daily expenses for current month
expenseSchema.statics.getDailyExpenses = async function(userId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  return await this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        type: 'expense',
        date: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: { $dayOfMonth: '$date' },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

// Get recent transactions
expenseSchema.statics.getRecent = async function(userId, limit = 10) {
  return await this.find({ user: userId })
    .sort({ date: -1, createdAt: -1 })
    .limit(limit)
    .lean();
};

// ==============================================
// INSTANCE METHODS
// ==============================================

// Get category icon
expenseSchema.methods.getCategoryIcon = function() {
  const icons = {
    'Food & Dining': '🍔',
    'Transportation': '🚗',
    'Shopping': '🛍️',
    'Entertainment': '🎬',
    'Bills & Utilities': '💡',
    'Healthcare': '🏥',
    'Education': '📚',
    'Travel': '✈️',
    'Investments': '📈',
    'Salary': '💰',
    'Freelance': '💻',
    'Business': '🏢',
    'Rent': '🏠',
    'EMI': '🏦',
    'Insurance': '🛡️',
    'Gifts': '🎁',
    'Other': '📌'
  };
  return icons[this.category] || '📌';
};

// ==============================================
// MIDDLEWARE
// ==============================================

// Auto-detect category using AI (placeholder)
expenseSchema.pre('save', function(next) {
  if (this.isNew && !this.category) {
    // AI category detection logic here
    this.category = 'Other';
    this.aiDetected = true;
    this.aiConfidence = 50;
  }
  next();
});

// Enable virtuals in JSON
expenseSchema.set('toJSON', { virtuals: true });
expenseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Expense', expenseSchema);