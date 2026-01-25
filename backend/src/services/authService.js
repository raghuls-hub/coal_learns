const User = require('../models/User');
const { generateTokens } = require('../config/jwt');
const crypto = require('crypto');

/**
 * Register a new user
 */
exports.register = async (userData) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Create new user
  const user = new User(userData);
  
  // Generate verification token
  user.verificationToken = crypto.randomBytes(32).toString('hex');
  
  await user.save();

  // Generate tokens
  const tokens = generateTokens(user);

  // Return user data (exclude password)
  const userResponse = {
    _id: user._id,
    email: user.email,
    role: user.role,
    profile: user.profile,
    isActive: user.isActive,
    isVerified: user.isVerified,
  };

  return { user: userResponse, ...tokens };
};

/**
 * Login user
 */
exports.login = async (email, password) => {
  // Find user and include password
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new Error('Account is deactivated.Contact support.');
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate tokens
  const tokens = generateTokens(user);

  // Return user data (exclude password)
  const userResponse = {
    _id: user._id,
    email: user.email,
    role: user.role,
    profile: user.profile,
    isActive: user.isActive,
    isVerified: user.isVerified,
    lastLogin: user.lastLogin,
  };

  return { user: userResponse, ...tokens };
};

/**
 * Refresh access token
 */
exports.refreshToken = async (userId) => {
  const user = await User.findById(userId);
  
  if (!user || !user.isActive) {
    throw new Error('User not found or inactive');
  }

  const tokens = generateTokens(user);
  return tokens;
};

/**
 * Request password reset
 */
exports.forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  
  if (!user) {
    // Don't reveal if email exists
    return { message: 'If the email exists, a reset link has been sent' };
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 3600000; // 1 hour

  await user.save();

  // In production, send email with resetToken
  // For now, return the token (remove in production)
  return {
    message: 'Password reset token generated',
    resetToken, // Remove this in production
  };
};

/**
 * Reset password
 */
exports.resetPassword = async (token, newPassword) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new Error('Invalid or expired reset token');
  }

  // Update password
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  return { message: 'Password reset successful' };
};

/**
 * Get current user
 */
exports.getCurrentUser = async (userId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }

  return {
    _id: user._id,
    email: user.email,
    role: user.role,
    profile: user.profile,
    isActive: user.isActive,
    isVerified: user.isVerified,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
  };
};
