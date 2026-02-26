// ==============================================
// CATEGORY MODEL
// ==============================================

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  type: {
    type: String,
    enum: ['expense', 'income'],
    required: true
  },
  icon: {
    type: String,
    default: '📁'
  },
  color: {
    type: String,
    default: '#6B7280'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  budget: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// ==============================================
// INDEXES
// ==============================================

categorySchema.index({ user: 1, name: 1 });
categorySchema.index({ user: 1, type: 1 });

// ==============================================
// STATIC METHODS
// ==============================================

// Create default categories for new user
categorySchema.statics.createDefaultCategories = async function(userId) {
  const defaultExpenseCategories = [
    { name: 'Food & Dining', icon: '🍔', color: '#EF4444', type: 'expense' },
    { name: 'Transportation', icon: '🚗', color: '#F59E0B', type: 'expense' },
    { name: 'Shopping', icon: '🛍️', color: '#EC4899', type: 'expense' },
    { name: 'Entertainment', icon: '🎬', color: '#8B5CF6', type: 'expense' },
    { name: 'Bills & Utilities', icon: '⚡', color: '#3B82F6', type: 'expense' },
    { name: 'Healthcare', icon: '🏥', color: '#10B981', type: 'expense' },
    { name: 'Education', icon: '📚', color: '#6366F1', type: 'expense' },
    { name: 'Investment', icon: '📈', color: '#059669', type: 'expense' },
    { name: 'Rent', icon: '🏠', color: '#DC2626', type: 'expense' },
    { name: 'Other', icon: '📌', color: '#6B7280', type: 'expense' }
  ];

  const defaultIncomeCategories = [
    { name: 'Salary', icon: '💰', color: '#10B981', type: 'income' },
    { name: 'Freelance', icon: '💼', color: '#3B82F6', type: 'income' },
    { name: 'Investment Returns', icon: '📊', color: '#8B5CF6', type: 'income' },
    { name: 'Other Income', icon: '💵', color: '#6B7280', type: 'income' }
  ];

  const categories = [...defaultExpenseCategories, ...defaultIncomeCategories].map(cat => ({
    ...cat,
    user: userId,
    isDefault: true
  }));

  return await this.insertMany(categories);
};

module.exports = mongoose.model('Category', categorySchema);