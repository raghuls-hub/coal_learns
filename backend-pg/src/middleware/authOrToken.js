const { verifyAccessToken } = require('../config/jwt');

const authOrToken = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) token = authHeader.substring(7);
    if (!token && req.query.token) token = req.query.token;

    if (!token) return res.status(401).json({ success: false, error: 'No token provided. Authorization required.' });

    const decoded = verifyAccessToken(token);
    req.user = { userId: decoded.userId, email: decoded.email, role: decoded.role };
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

module.exports = authOrToken;
