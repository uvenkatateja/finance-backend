const { ApiError } = require('../utils/ApiError');

/**
 * Role → Permission mapping.
 *
 * Permissions:
 *   read           — view records, list users
 *   read_analytics — access dashboard summaries and trends
 *   write          — create and update records
 *   delete         — soft-delete records
 *   manage_users   — create users, change roles, activate/deactivate
 */
const rolePermissions = {
  viewer:  ['read'],
  analyst: ['read', 'read_analytics'],
  admin:   ['read', 'read_analytics', 'write', 'delete', 'manage_users'],
};

/**
 * Middleware factory: checks if the authenticated user has the required permission.
 * Must be used AFTER the authenticate middleware.
 *
 * @param {string} permission - Required permission key
 */
function authorize(permission) {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    const permissions = rolePermissions[userRole] || [];

    if (!permissions.includes(permission)) {
      return next(
        ApiError.forbidden(
          `Role '${userRole}' does not have '${permission}' permission`
        )
      );
    }

    next();
  };
}

module.exports = { authorize, rolePermissions };
