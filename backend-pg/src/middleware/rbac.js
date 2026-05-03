const permissions = {
  admin: [
    'course:view', 'course:update', 'course:delete', 'course:publish',
    'module:create', 'module:update', 'module:delete', 'module:view',
    'content:create', 'content:update', 'content:delete', 'content:view',
    'analytics:view_all',
    'user:create', 'user:view', 'user:update', 'user:delete',
    'certificate:view', 'certificate:revoke',
    'payment:view', 'payment:refund',
  ],
  mentor: [
    'course:create', 'course:update', 'course:delete', 'course:view', 'course:publish',
    'module:create', 'module:update', 'module:delete', 'module:view',
    'content:create', 'content:update', 'content:delete', 'content:view',
    'analytics:view_own_courses',
  ],
  candidate: [
    'course:view', 'course:enroll',
    'content:view',
    'certificate:view',
    'progress:view',
  ],
};

const authorize = (requiredPermission) => (req, res, next) => {
  const userRole = req.user?.role;
  if (!userRole) return res.status(401).json({ success: false, error: 'Authentication required' });
  const userPermissions = permissions[userRole] || [];
  if (userPermissions.includes('*') || userPermissions.includes(requiredPermission)) return next();
  return res.status(403).json({ success: false, error: 'Forbidden. You do not have permission to access this resource.' });
};

const requireRole = (...allowedRoles) => (req, res, next) => {
  const userRole = req.user?.role;
  if (!userRole) return res.status(401).json({ success: false, error: 'Authentication required' });
  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({ success: false, error: `Access denied. Required role: ${allowedRoles.join(' or ')}` });
  }
  next();
};

module.exports = { authorize, requireRole, permissions };
