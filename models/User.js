// ==============================================
// USER MODEL - FINSARTHI (FIXED)
// ==============================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  avatar: {
    type: String,
    default: 'https://ui-avatars.com/api/?name=User&background=4F46E5&color=fff'
  },
  googleId: {
    type: String,
    sparse: true
  },
  phone: {
    type: String,
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
  },
  
  // Financial Profile
  monthlyIncome: {
    type: Number,
    default: 0,
    min: [0, 'Income cannot be negative']
  },
  savingsGoal: {
    type: Number,
    default: 0,
    min: [0, 'Savings goal cannot be negative']
  },
  riskAppetite: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  currency: {
    type: String,
    default: 'INR'
  },
  
  // Verification & Security
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
  // Account Status
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  refreshToken: {
    type: String,
    select: false
  },
  
  // Onboarding
  isOnboarded: {
    type: Boolean,
    default: false
  },
  onboardingStep: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// ==============================================
// INDEXES (Optimized - NO DUPLICATES)
// ==============================================

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });
userSchema.index({ createdAt: -1 });

// ==============================================
// PRE-SAVE MIDDLEWARE (Password Hashing)
// ==============================================

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update avatar when name changes
userSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.avatar.includes('googleusercontent')) {
    this.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=4F46E5&color=fff&size=200`;
  }
  next();
});

// ==============================================
// INSTANCE METHODS
// ==============================================

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate verification token (6-digit OTP)
userSchema.methods.generateVerificationToken = function() {
  const token = Math.floor(100000 + Math.random() * 900000).toString();
  this.verificationToken = token;
  this.verificationTokenExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  return token;
};

// Generate reset password token
userSchema.methods.generateResetToken = function() {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
  return resetToken;
};

// Get public profile (hide sensitive data)
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    phone: this.phone,
    isVerified: this.isVerified,
    role: this.role,
    monthlyIncome: this.monthlyIncome,
    savingsGoal: this.savingsGoal,
    riskAppetite: this.riskAppetite,
    currency: this.currency,
    isOnboarded: this.isOnboarded,
    createdAt: this.createdAt
  };
};

// Calculate financial health score
userSchema.methods.calculateHealthScore = function(totalExpenses, totalSavings) {
  let score = 50; // Base score
  
  if (this.monthlyIncome > 0) {
    const savingsRate = (this.monthlyIncome - totalExpenses) / this.monthlyIncome;
    score += savingsRate * 30;
  }
  
  if (totalSavings >= this.savingsGoal * 3) {
    score += 20; // Emergency fund bonus
  }
  
  return Math.min(100, Math.max(0, Math.round(score)));
};

// ==============================================
// EXPORT MODEL - CRITICAL!
// ==============================================

module.exports = mongoose.model('User', userSchema);