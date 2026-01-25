const User = require('../models/User');

/**
 * Get all users (admin only)
 */
exports.getUsers = async (filters = {}, page = 1, limit = 10) => {
  const query = {};

  if (filters.role) query.role = filters.role;
  if (filters.isActive !== undefined) query.isActive = filters.isActive;
  if (filters.search) {
    query.$or = [
      { email: { $regex: filters.search, $options: 'i' } },
      { 'profile.firstName': { $regex: filters.search, $options: 'i' } },
      { 'profile.lastName': { $regex: filters.search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const users = await User.find(query)
    .select('-password')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(query);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get user by ID
 */
exports.getUserById = async (userId) => {
  const user = await User.findById(userId).select('-password');

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

/**
 * Create user (admin only)
 */
exports.createUser = async (userData) => {
  // Check if user exists
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  const user = new User(userData);
  await user.save();

  // Return without password
  const userResponse = user.toObject();
  delete userResponse.password;

  return userResponse;
};

/**
 * Update user
 */
exports.updateUser = async (userId, updateData) => {
  // Don't allow password update through this endpoint
  delete updateData.password;

  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  Object.assign(user, updateData);
  await user.save();

  const userResponse = user.toObject();
  delete userResponse.password;

  return userResponse;
};

/**
 * Delete user
 */
exports.deleteUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  await User.findByIdAndDelete(userId);

  return { message: 'User deleted successfully' };
};

/**
 * Toggle user active status
 */
exports.toggleUserStatus = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  user.isActive = !user.isActive;
  await user.save();

  const userResponse = user.toObject();
  delete userResponse.password;

  return userResponse;
};

module.exports = exports;
