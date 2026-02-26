// ==============================================
// AUTHENTICATION CONTROLLER - FINSARTHI (FIXED)
// ==============================================

const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorMiddleware');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// ==============================================
// HELPER FUNCTIONS
// ==============================================

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  });
};

// Send Token Response
const sendTokenResponse = (user, statusCode, res, message) => {
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token to user
  user.refreshToken = refreshToken;
  user.lastLogin = Date.now();
  user.save({ validateBeforeSave: false });

  // Cookie options
  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res.status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      message,
      token,
      refreshToken,
      user: user.getPublicProfile()
    });
};

// ==============================================
// @desc    Register User
// @route   POST /api/auth/register
// @access  Public
// ==============================================

exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone, monthlyIncome, savingsGoal, riskAppetite } = req.body;

  // Check if user exists (using findOne correctly)
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email'
    });
  }

  // Create user
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    phone,
    monthlyIncome: monthlyIncome || 0,
    savingsGoal: savingsGoal || 0,
    riskAppetite: riskAppetite || 'Medium',
    isOnboarded: false
  });

  // Generate verification token (optional)
  const verificationToken = user.generateVerificationToken();
  await user.save({ validateBeforeSave: false });

  // TODO: Send verification email
  console.log('📧 Verification Token:', verificationToken);

  sendTokenResponse(user, 201, res, 'Registration successful! Welcome to Finsarthi.');
});

// ==============================================
// @desc    Login User
// @route   POST /api/auth/login
// @access  Public
// ==============================================

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }

  // Find user with password
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check password
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Your account has been deactivated. Please contact support.'
    });
  }

  sendTokenResponse(user, 200, res, 'Login successful');
});

// ==============================================
// @desc    Logout User
// @route   POST /api/auth/logout
// @access  Private
// ==============================================

exports.logout = asyncHandler(async (req, res, next) => {
  // Clear refresh token
  const user = await User.findById(req.user.id);
  user.refreshToken = undefined;
  await user.save({ validateBeforeSave: false });

  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// ==============================================
// @desc    Get Current User
// @route   GET /api/auth/me
// @access  Private
// ==============================================

exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    data: user.getPublicProfile()
  });
});

// ==============================================
// @desc    Refresh Access Token
// @route   POST /api/auth/refresh
// @access  Public
// ==============================================

exports.refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token required'
    });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);

    // Find user
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Update refresh token
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }
});

// ==============================================
// @desc    Verify Email
// @route   POST /api/auth/verify-email
// @access  Public
// ==============================================

exports.verifyEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.body;

  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpire: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired verification token'
    });
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpire = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Email verified successfully! You can now use all features.'
  });
});

// ==============================================
// @desc    Resend Verification Email
// @route   POST /api/auth/resend-verification
// @access  Private
// ==============================================

exports.resendVerification = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (user.isVerified) {
    return res.status(400).json({
      success: false,
      message: 'Email already verified'
    });
  }

  const verificationToken = user.generateVerificationToken();
  await user.save({ validateBeforeSave: false });

  // TODO: Send verification email
  console.log('📧 New Verification Token:', verificationToken);

  res.status(200).json({
    success: true,
    message: 'Verification email sent successfully',
    token: verificationToken // Remove in production
  });
});

// ==============================================
// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
// ==============================================

exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'No user found with this email'
    });
  }

  // Generate reset token
  const resetToken = user.generateResetToken();
  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

  // TODO: Send email with reset link
  console.log('🔑 Password Reset URL:', resetUrl);

  res.status(200).json({
    success: true,
    message: 'Password reset link sent to your email',
    resetToken, // Remove in production
    resetUrl // Remove in production
  });
});

// ==============================================
// @desc    Reset Password
// @route   POST /api/auth/reset-password/:token
// @access  Public
// ==============================================

exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Hash token from params
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token'
    });
  }

  // Validate new password
  if (!req.body.password || req.body.password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters'
    });
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password reset successful! You can now login.');
});

// ==============================================
// @desc    Update Password
// @route   PUT /api/auth/update-password
// @access  Private
// ==============================================

exports.updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // Validate input
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide current and new password'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters'
    });
  }

  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password updated successfully');
});

// ==============================================
// @desc    Update Profile
// @route   PUT /api/auth/profile
// @access  Private
// ==============================================

exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { name, phone, monthlyIncome, savingsGoal, riskAppetite, avatar } = req.body;

  const user = await User.findById(req.user.id);

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (monthlyIncome !== undefined) user.monthlyIncome = monthlyIncome;
  if (savingsGoal !== undefined) user.savingsGoal = savingsGoal;
  if (riskAppetite) user.riskAppetite = riskAppetite;
  if (avatar) user.avatar = avatar;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: user.getPublicProfile()
  });
});

// ==============================================
// @desc    Complete Onboarding
// @route   PUT /api/auth/onboarding
// @access  Private
// ==============================================

exports.completeOnboarding = asyncHandler(async (req, res, next) => {
  const { monthlyIncome, savingsGoal, riskAppetite } = req.body;

  const user = await User.findById(req.user.id);

  user.monthlyIncome = monthlyIncome || 0;
  user.savingsGoal = savingsGoal || 0;
  user.riskAppetite = riskAppetite || 'Medium';
  user.isOnboarded = true;
  user.onboardingStep = 5;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Onboarding completed! Welcome to Finsarthi.',
    user: user.getPublicProfile()
  });
});

// ==============================================
// @desc    Google OAuth Callback (Future)
// @route   GET /api/auth/google/callback
// @access  Public
// ==============================================

exports.googleCallback = asyncHandler(async (req, res, next) => {
  sendTokenResponse(req.user, 200, res, 'Google login successful');
});

// ==============================================
// @desc    Delete Account
// @route   DELETE /api/auth/account
// @access  Private
// ==============================================

exports.deleteAccount = asyncHandler(async (req, res, next) => {
  const { password } = req.body;

  const user = await User.findById(req.user.id).select('+password');

  // Verify password
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Password is incorrect'
    });
  }

  // Soft delete (deactivate)
  user.isActive = false;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Account deactivated successfully'
  });
});