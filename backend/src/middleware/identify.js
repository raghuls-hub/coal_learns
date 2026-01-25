const { verifyAccessToken } = require('../config/jwt');

/**
 * Optional identification middleware - populate req.user if token is present
 * Does not block if token is missing or invalid
 */
const identify = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);
      
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
      console.log(`[Identify] Identified user: ${req.user.email} (${req.user.role})`);
    } else {
      console.log('[Identify] No user token provided');
    }
    
    next();
  } catch (error) {
    console.log('[Identify] Invalid token provided:', error.message);
    // Just continue without user info if token is invalid
    next();
  }
};

module.exports = identify;
