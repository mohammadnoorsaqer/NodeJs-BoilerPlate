const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const config = require('./config');
const { tokenTypes } = require('./tokens');
const { users } = require('../db/models');

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

const jwtVerify = async (payload, done) => {
  try {
    // Verify token type
    if (payload.type !== tokenTypes.ACCESS) {
      return done(null, false);
    }

    // Find user by ID from token payload
    const user = await users.findByPk(payload.sub);

    if (!user) {
      return done(null, false);
    }

    // Check if user is active and not deleted
    if (user.is_deleted || !user.is_active) {
      return done(null, false);
    }

    // Check token_version for token revocation
    // This is the primary mechanism for revoking tokens (e.g., on logout)
    const tokenVersion =
      payload.tokenVersion !== undefined ? payload.tokenVersion : null;
    const userTokenVersion = user.token_version || 0;

    // If token_version doesn't match, token is revoked
    if (tokenVersion !== null && tokenVersion !== userTokenVersion) {
      return done(null, false);
    }

    // Attach full user object to req.user
    done(null, user);
  } catch (error) {
    done(error, false);
  }
};

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

module.exports = {
  jwtStrategy,
};
