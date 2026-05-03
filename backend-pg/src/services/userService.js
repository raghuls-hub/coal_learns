const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

const USER_PUBLIC_FIELDS = `
  id, email, role, first_name, last_name, phone, avatar, bio,
  is_active, is_verified, last_login, created_at, updated_at
`;

const formatUser = (row) => ({
  _id: row.id,
  id: row.id,
  email: row.email,
  role: row.role,
  profile: {
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    avatar: row.avatar,
    bio: row.bio,
  },
  isActive: row.is_active,
  isVerified: row.is_verified,
  lastLogin: row.last_login,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

exports.getUsers = async (filters = {}, page = 1, limit = 10) => {
  const conditions = [];
  const params = [];
  let i = 1;

  if (filters.role) {
    conditions.push(`role = $${i++}`);
    params.push(filters.role);
  }
  if (filters.isActive !== undefined) {
    conditions.push(`is_active = $${i++}`);
    params.push(filters.isActive);
  }
  if (filters.search) {
    conditions.push(
      `(email ILIKE $${i} OR first_name ILIKE $${i} OR last_name ILIKE $${i})`
    );
    params.push(`%${filters.search}%`);
    i++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const [dataRes, countRes] = await Promise.all([
    pool.query(
      `SELECT ${USER_PUBLIC_FIELDS} FROM users ${where} ORDER BY created_at DESC LIMIT $${i} OFFSET $${i + 1}`,
      [...params, limit, offset]
    ),
    pool.query(`SELECT COUNT(*) FROM users ${where}`, params),
  ]);

  const total = parseInt(countRes.rows[0].count);
  return {
    users: dataRes.rows.map(formatUser),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

exports.getUserById = async (userId) => {
  const { rows } = await pool.query(
    `SELECT ${USER_PUBLIC_FIELDS} FROM users WHERE id = $1`,
    [userId]
  );
  if (!rows.length) throw new Error('User not found');
  return formatUser(rows[0]);
};

exports.createUser = async (userData) => {
  const { email, password, role, profile } = userData;

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rows.length) throw new Error('User with this email already exists');

  const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
  const hashed = await bcrypt.hash(password, salt);

  const { rows } = await pool.query(
    `INSERT INTO users (email, password, role, first_name, last_name, phone, avatar, bio)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING ${USER_PUBLIC_FIELDS}`,
    [
      email.toLowerCase(), hashed, role,
      profile.firstName, profile.lastName,
      profile.phone || null, profile.avatar || null, profile.bio || null,
    ]
  );
  return formatUser(rows[0]);
};

exports.updateUser = async (userId, updateData) => {
  delete updateData.password;

  const { rows: existing } = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
  if (!existing.length) throw new Error('User not found');

  const fields = [];
  const params = [];
  let i = 1;

  const fieldMap = {
    email: 'email',
    role: 'role',
    isActive: 'is_active',
    isVerified: 'is_verified',
  };

  for (const [key, col] of Object.entries(fieldMap)) {
    if (updateData[key] !== undefined) {
      fields.push(`${col} = $${i++}`);
      params.push(updateData[key]);
    }
  }

  // Handle nested profile fields
  if (updateData.profile) {
    const profileMap = {
      firstName: 'first_name',
      lastName: 'last_name',
      phone: 'phone',
      avatar: 'avatar',
      bio: 'bio',
    };
    for (const [key, col] of Object.entries(profileMap)) {
      if (updateData.profile[key] !== undefined) {
        fields.push(`${col} = $${i++}`);
        params.push(updateData.profile[key]);
      }
    }
  }

  if (!fields.length) {
    return exports.getUserById(userId);
  }

  fields.push(`updated_at = NOW()`);
  params.push(userId);

  const { rows } = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${i} RETURNING ${USER_PUBLIC_FIELDS}`,
    params
  );
  return formatUser(rows[0]);
};

exports.deleteUser = async (userId) => {
  const { rows } = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
  if (!rows.length) throw new Error('User not found');
  return { message: 'User deleted successfully' };
};

exports.toggleUserStatus = async (userId) => {
  const { rows } = await pool.query(
    `UPDATE users SET is_active = NOT is_active, updated_at = NOW()
     WHERE id = $1
     RETURNING ${USER_PUBLIC_FIELDS}`,
    [userId]
  );
  if (!rows.length) throw new Error('User not found');
  return formatUser(rows[0]);
};
