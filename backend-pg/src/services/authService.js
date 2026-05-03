const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool } = require('../config/database');
const { generateTokens } = require('../config/jwt');

const USER_PUBLIC_FIELDS = `
  id, email, role, first_name, last_name, phone, avatar, bio,
  is_active, is_verified, last_login, created_at
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
});

exports.register = async (userData) => {
  const { email, password, role, profile } = userData;

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rows.length) throw new Error('User with this email already exists');

  const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
  const hashed = await bcrypt.hash(password, salt);
  const verificationToken = crypto.randomBytes(32).toString('hex');

  const { rows } = await pool.query(
    `INSERT INTO users (email, password, role, first_name, last_name, phone, avatar, bio, verification_token)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING ${USER_PUBLIC_FIELDS}`,
    [
      email.toLowerCase(), hashed, role,
      profile.firstName, profile.lastName,
      profile.phone || null, profile.avatar || null, profile.bio || null,
      verificationToken,
    ]
  );

  const user = formatUser(rows[0]);
  const tokens = generateTokens(rows[0]);
  return { user, ...tokens };
};

exports.login = async (email, password, expectedRole) => {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (!rows.length) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const row = rows[0];

  if (expectedRole && row.role !== expectedRole) {
    const err = new Error(`Unauthorized. This portal is for ${expectedRole}s only.`);
    err.statusCode = 403;
    throw err;
  }

  if (!row.is_active) {
    const err = new Error('Account is deactivated. Contact support.');
    err.statusCode = 403;
    throw err;
  }

  const valid = await bcrypt.compare(password, row.password);
  if (!valid) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  await pool.query('UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = $1', [row.id]);
  row.last_login = new Date();

  const tokens = generateTokens(row);
  return { user: formatUser(row), ...tokens };
};

exports.refreshToken = async (userId) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1 AND is_active = TRUE', [userId]);
  if (!rows.length) throw new Error('User not found or inactive');
  return generateTokens(rows[0]);
};

exports.forgotPassword = async (email) => {
  const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (!rows.length) return { message: 'If the email exists, a reset link has been sent' };

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expire = new Date(Date.now() + 3600000);

  await pool.query(
    'UPDATE users SET reset_password_token=$1, reset_password_expire=$2, updated_at=NOW() WHERE id=$3',
    [hashed, expire, rows[0].id]
  );

  return { message: 'Password reset token generated', resetToken };
};

exports.resetPassword = async (token, newPassword) => {
  const hashed = crypto.createHash('sha256').update(token).digest('hex');

  const { rows } = await pool.query(
    'SELECT id FROM users WHERE reset_password_token=$1 AND reset_password_expire > NOW()',
    [hashed]
  );
  if (!rows.length) throw new Error('Invalid or expired reset token');

  const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
  const hashedPw = await bcrypt.hash(newPassword, salt);

  await pool.query(
    'UPDATE users SET password=$1, reset_password_token=NULL, reset_password_expire=NULL, updated_at=NOW() WHERE id=$2',
    [hashedPw, rows[0].id]
  );

  return { message: 'Password reset successful' };
};

exports.getCurrentUser = async (userId) => {
  const { rows } = await pool.query(
    `SELECT ${USER_PUBLIC_FIELDS} FROM users WHERE id = $1`,
    [userId]
  );
  if (!rows.length) throw new Error('User not found');
  return formatUser(rows[0]);
};
