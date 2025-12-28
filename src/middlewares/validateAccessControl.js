const httpStatus = require("http-status").default;
const { roles } = require("../config/roles");
const ApiError = require("../utils/ApiError");

/**
 * Grant access based on role and resource
 * Automatically handles 'own' vs 'any' based on userId match
 */
function grantAccess(action, resource) {
  return async (req, _res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.role) {
        throw new ApiError(
          httpStatus.UNAUTHORIZED,
          "Authentication required",
          "المصادقة مطلوبة"
        );
      }

      const authenticatedUserId = req.user.id;
      const targetUserIdParam = req.params.userId || req.params.id;

      // Determine if accessing own resource
      const isOwnResource = authenticatedUserId == targetUserIdParam;

      // Modify action based on ownership (e.g., 'readAny' -> 'readOwn')
      const modifiedAction = isOwnResource
        ? action.replace("Any", "Own")
        : action;

      // Check permission using AccessControl
      const permission = roles.can(req.user.role)[modifiedAction](resource);

      [modifiedAction](resource);

      if (!permission.granted) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          "You are not authorized to access this resource",
          "ليس لديك صلاحية للوصول إلى هذا المورد"
        );
      }

      // Store permission in request for potential filtering
      req.permission = permission;

      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { grantAccess };
