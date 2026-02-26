// ==============================================
// COURSE MODEL - FINANCE ACADEMY
// ==============================================

const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: true
  }],
  correctAnswer: {
    type: Number,
    required: true,
    min: 0,
    max: 3
  },
  explanation: String
});

const chapterSchema = new mongoose.Schema({
  chapterNumber: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  content: {
    type: String,
    required: true
  },
  videoUrl: String,
  duration: {
    type: Number, // in minutes
    default: 15
  },
  points: {
    type: Number,
    default: 10
  },
  quiz: [quizSchema],
  keyTakeaways: [String],
  resources: [{
    title: String,
    url: String,
    type: String // article, video, tool
  }]
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  category: {
    type: String,
    enum: ['Personal Finance', 'Investing', 'Wealth Management', 'Tax Planning', 'Retirement Planning'],
    default: 'Personal Finance'
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  chapters: [chapterSchema],
  totalPoints: Number,
  totalDuration: Number, // in minutes
  thumbnail: String,
  isPublished: {
    type: Boolean,
    default: true
  },
  enrolledCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Calculate total points and duration
courseSchema.pre('save', function(next) {
  if (this.chapters && this.chapters.length > 0) {
    this.totalPoints = this.chapters.reduce((sum, ch) => sum + (ch.points || 10), 0);
    this.totalDuration = this.chapters.reduce((sum, ch) => sum + (ch.duration || 15), 0);
  }
  next();
});

module.exports = mongoose.model('Course', courseSchema);