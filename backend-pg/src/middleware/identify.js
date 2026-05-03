const { verifyAccessToken } = require('../config/jwt');

const identify = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const decoded = verifyAccessToken(authHeader.substring(7));
      req.user = { userId: decoded.userId, email: decoded.email, role: decoded.role };
    }
  } catch {
    // Continue without user info
  }
  next();
};

module.exports = identify;
