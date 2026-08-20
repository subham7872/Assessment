const AppError = require('../utils/AppError');

const ROLES = {
  ADMIN: 'project_admin',
  MEMBER: 'member',
  VIEWER: 'viewer',
};

const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.projectMember) {
      throw new AppError('Not a project member', 403);
    }

    if (!allowedRoles.includes(req.projectMember.role)) {
      throw new AppError('Insufficient permissions', 403);
    }

    next();
  };
};

module.exports = {
  ROLES,
  checkRole,
};
