// ==============================================
// CHAT HISTORY MODEL - FINBOT
// ==============================================

const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userMessage: {
    type: String,
    required: true,
    trim: true
  },
  botResponse: {
    type: String,
    required: true
  },
  financialContext: {
    monthlyIncome: Number,
    totalExpense: Number,
    savingsRate: Number,
    recentExpenses: [String]
  },
  intent: {
    type: String,
    enum: ['expense_query', 'saving_advice', 'investment_query', 'general', 'purchase_advice', 'scheme_info'],
    default: 'general'
  },
  sentiment: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    default: 'neutral'
  },
  isStarred: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for fast retrieval
chatSchema.index({ user: 1, createdAt: -1 });

// Get recent chats
chatSchema.statics.getRecentChats = async function(userId, limit = 10) {
  return await this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

// Get starred chats
chatSchema.statics.getStarredChats = async function(userId) {
  return await this.find({ user: userId, isStarred: true })
    .sort({ createdAt: -1 })
    .lean();
};

module.exports = mongoose.model('Chat', chatSchema);