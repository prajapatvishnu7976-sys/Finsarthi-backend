// ==============================================
// ALERT MODEL
// ==============================================

const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'budget_exceeded',
      'budget_warning',
      'unusual_spending',
      'savings_goal_achieved',
      'savings_goal_missed',
      'purchase_affordable',
      'low_balance',
      'monthly_report'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical', 'success'],
    default: 'info'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  actionUrl: {
    type: String
  }
}, {
  timestamps: true
});

// ==============================================
// INDEXES
// ==============================================

alertSchema.index({ user: 1, isRead: 1, createdAt: -1 });
alertSchema.index({ user: 1, type: 1 });

// ==============================================
// METHODS
// ==============================================

alertSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  return await this.save();
};

// ==============================================
// STATIC METHODS
// ==============================================

// Create alert
alertSchema.statics.createAlert = async function(userId, type, title, message, options = {}) {
  return await this.create({
    user: userId,
    type,
    title,
    message,
    severity: options.severity || 'info',
    metadata: options.metadata || {},
    actionUrl: options.actionUrl
  });
};

// Get unread count
alertSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ user: userId, isRead: false });
};

// Mark all as read
alertSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { user: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

module.exports = mongoose.model('Alert', alertSchema);