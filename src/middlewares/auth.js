const passport = require('passport');
const httpStatus = require('http-status').default;
const ApiError = require('../utils/ApiError');

/**
 * Verify callback for passport authentication
 */
const verifyCallback = (req, resolve, reject) => async (err, user, info) => {
  if (err || info || !user) {
    return reject(
      new ApiError(
        httpStatus.UNAUTHORIZED,
        'Please authenticate',
        'الرجاء المصادقة',
      ),
    );
  }

  req.user = user;
  resolve();
};

/**
 * Auth middleware with optional role checking
 * @param {...string} requiredRoles - Required roles (optional)
 */
const auth =
  (...requiredRoles) =>
  async (req, res, next) => {
    return new Promise((resolve, reject) => {
      passport.authenticate(
        'jwt',
        { session: false },
        verifyCallback(req, resolve, reject),
      )(req, res, next);
    })
      .then(() => {
        // If specific roles are required, check them
        if (requiredRoles.length) {
          const userRole = req.user.role;
          const hasRequiredRole = requiredRoles.includes(userRole);

          if (!hasRequiredRole) {
            return Promise.reject(
              new ApiError(
                httpStatus.FORBIDDEN,
                'Insufficient permissions',
                'صلاحيات غير كافية',
              ),
            );
          }
        }
        next();
      })
      .catch((err) => next(err));
  };

module.exports = auth;
