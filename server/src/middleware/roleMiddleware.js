/**
 * Role-Based Access Control (RBAC) middleware
 * Allowed roles: 'Employee', 'TeamLead', 'WorkforcePlanner', 'HRAdmin'
 */
export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication is required before checking permissions.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'ForbiddenRole',
        message: `Role '${req.user.role}' is not authorized to perform this action. Required: [${allowedRoles.join(', ')}].`
      });
    }

    next();
  };
}
