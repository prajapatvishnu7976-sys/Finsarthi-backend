// ==============================================
// USER PROGRESS MODEL - GAMIFICATION
// ==============================================

const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  courses: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    completedChapters: [{
      chapterNumber: Number,
      completedAt: Date,
      quizScore: Number,
      timeSpent: Number // in minutes
    }],
    totalPoints: {
      type: Number,
      default: 0
    },
    progress: {
      type: Number, // percentage
      default: 0
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    certificate: String // URL to certificate
  }],
  totalPoints: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  badges: [{
    name: String,
    icon: String,
    description: String,
    earnedAt: Date
  }],
  streak: {
    current: {
      type: Number,
      default: 0
    },
    longest: {
      type: Number,
      default: 0
    },
    lastActivityDate: Date
  },
  achievements: [{
    type: String,
    enum: [
      'first_chapter',
      'first_course',
      'quiz_master',
      'week_streak',
      'month_streak',
      'points_100',
      'points_500',
      'points_1000',
      'all_courses'
    ],
    earnedAt: Date
  }]
}, {
  timestamps: true
});

// Update streak
userProgressSchema.methods.updateStreak = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActivity = this.streak.lastActivityDate 
    ? new Date(this.streak.lastActivityDate)
    : null;
  
  if (lastActivity) {
    lastActivity.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // Consecutive day
      this.streak.current += 1;
      if (this.streak.current > this.streak.longest) {
        this.streak.longest = this.streak.current;
      }
    } else if (daysDiff > 1) {
      // Streak broken
      this.streak.current = 1;
    }
    // If same day, no change
  } else {
    // First activity
    this.streak.current = 1;
    this.streak.longest = 1;
  }
  
  this.streak.lastActivityDate = new Date();
};

// Calculate level based on points
userProgressSchema.methods.calculateLevel = function() {
  // Level up every 100 points
  this.level = Math.floor(this.totalPoints / 100) + 1;
};

// Award badges
userProgressSchema.methods.checkAndAwardBadges = function() {
  const badges = [];
  
  if (this.totalPoints >= 100 && !this.badges.find(b => b.name === 'Century Scorer')) {
    badges.push({
      name: 'Century Scorer',
      icon: '🏆',
      description: 'Earned 100 points',
      earnedAt: new Date()
    });
  }
  
  if (this.streak.longest >= 7 && !this.badges.find(b => b.name === 'Week Warrior')) {
    badges.push({
      name: 'Week Warrior',
      icon: '🔥',
      description: '7-day learning streak',
      earnedAt: new Date()
    });
  }
  
  if (this.courses.filter(c => c.isCompleted).length >= 5 && !this.badges.find(b => b.name === 'Course Master')) {
    badges.push({
      name: 'Course Master',
      icon: '📚',
      description: 'Completed 5 courses',
      earnedAt: new Date()
    });
  }
  
  this.badges.push(...badges);
  return badges;
};

module.exports = mongoose.model('UserProgress', userProgressSchema);