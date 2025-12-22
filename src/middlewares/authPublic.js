const passport = require('passport');

/**
 * Public route middleware - authentication is optional
 * If a valid token is provided, user will be attached to req.user
 * If no token or invalid token, request continues without req.user
 * This allows public routes that can optionally use user context
 */
const authPublic = async (req, res, next) => {
  return new Promise((resolve) => {
    passport.authenticate(
      'jwt',
      { session: false },
      (err, user, info) => {
        // Don't reject on authentication failure for public routes
        // Just continue without user attached
        if (!err && user) {
          req.user = user;
        }
        resolve();
      }
    )(req, res, next);
  })
    .then(() => {
      // Always continue, regardless of authentication status
      next();
    })
    .catch(() => {
      // Even if there's an error, continue for public routes
      next();
    });
};

module.exports = authPublic;

