/**
 * Role-based access control middleware
 */

// Define permissions for each role
const permissions = {
  admin: [
    // Admin CANNOT create courses, only manage them
    'course:view', 'course:update', 'course:delete', 'course:publish',
    'module:create', 'module:update', 'module:delete', 'module:view',
    'content:create', 'content:update', 'content:delete', 'content:view',
    'assessment:create', 'assessment:update', 'assessment:delete', 'assessment:view',
    'tutor:invite', 'tutor:remove',
    'analytics:view_all',
    // Admin can manage users
    'user:create', 'user:view', 'user:update', 'user:delete',
    'certificate:view', 'certificate:revoke',
    'payment:view', 'payment:refund',
  ],
  
  course_handler: [
    // Course handlers can create, manage courses
    'course:create', 'course:update', 'course:delete', 'course:view', 'course:publish',
    'module:create', 'module:update', 'module:delete', 'module:view',
    'content:create', 'content:update', 'content:delete', 'content:view',
    'assessment:create', 'assessment:update', 'assessment:delete', 'assessment:view',
    'tutor:invite', 'tutor:remove',
    'analytics:view_own_courses',
  ],
  
  tutor: [
    'course:view',
    'module:view',
    'content:view',
    'analytics:view_assigned_courses',
  ],
  
  candidate: [
    'course:view', 'course:enroll',
    'content:view',
    'assessment:attempt',
    'certificate:view',
    'progress:view',
  ],
};

/**
 * Check if user has required permission
 */
const authorize = (requiredPermission) => {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const userPermissions = permissions[userRole] || [];

    // Check if user has wildcard permission or specific permission
    if (userPermissions.includes('*') || userPermissions.includes(requiredPermission)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'Forbidden. You do not have permission to access this resource.',
    });
  };
};

/**
 * Check if user has any of the required roles
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
      });
    }

    next();
  };
};

module.exports = {
  authorize,
  requireRole,
  permissions,
};
