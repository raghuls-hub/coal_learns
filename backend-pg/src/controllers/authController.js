const authService = require('../services/authService');
const { verifyRefreshToken } = require('../config/jwt');
const { pool } = require('../config/database');

exports.register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, message: 'User registered successfully', data: result });
  } catch (error) { next(error); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    const result = await authService.login(email, password, role);
    res.status(200).json({ success: true, message: 'Login successful', data: result });
  } catch (error) { next(error); }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, error: 'Refresh token is required' });
    const decoded = verifyRefreshToken(refreshToken);
    const result = await authService.refreshToken(decoded.userId);
    res.status(200).json({ success: true, message: 'Token refreshed successfully', data: result });
  } catch (error) { next(error); }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body.email);
    res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const result = await authService.resetPassword(token, password);
    res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.getCurrentUser = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, email, role, first_name, last_name, phone, avatar, bio,
              is_active, is_verified, last_login, created_at
       FROM users WHERE id = $1`,
      [req.user.userId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });
    const u = rows[0];
    res.status(200).json({
      success: true,
      data: {
        _id: u.id, id: u.id, email: u.email, role: u.role,
        profile: { firstName: u.first_name, lastName: u.last_name, phone: u.phone, avatar: u.avatar, bio: u.bio },
        isActive: u.is_active, isVerified: u.is_verified, lastLogin: u.last_login, createdAt: u.created_at,
      },
    });
  } catch (error) { next(error); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, bio } = req.body;
    const fields = [];
    const params = [];
    let i = 1;

    if (firstName !== undefined) { fields.push(`first_name = $${i++}`); params.push(firstName); }
    if (lastName !== undefined)  { fields.push(`last_name = $${i++}`);  params.push(lastName); }
    if (phone !== undefined)     { fields.push(`phone = $${i++}`);      params.push(phone); }
    if (bio !== undefined)       { fields.push(`bio = $${i++}`);        params.push(bio); }

    if (!fields.length) return res.status(400).json({ success: false, message: 'No fields to update' });

    fields.push(`updated_at = NOW()`);
    params.push(req.user.userId);

    const { rows } = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${i}
       RETURNING id, email, role, first_name, last_name, phone, avatar, bio, is_active, is_verified`,
      params
    );

    const u = rows[0];
    res.status(200).json({
      success: true,
      data: {
        _id: u.id, id: u.id, email: u.email, role: u.role,
        profile: { firstName: u.first_name, lastName: u.last_name, phone: u.phone, avatar: u.avatar, bio: u.bio },
        isActive: u.is_active, isVerified: u.is_verified,
      },
    });
  } catch (error) { next(error); }
};
