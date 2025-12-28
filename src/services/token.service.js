const jwt = require('jsonwebtoken');
const dayjs = require('dayjs');
const config = require('../config/config');
const { tokenTypes } = require('../config/tokens');
const { users } = require('../db/models');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status').default;

/**
 * Generate JWT token
 */
const generateToken = ({
  userId,
  expires,
  role,
  type,
  tokenVersion,
  secret = config.jwt.secret,
}) => {
  const payload = {
    sub: userId,
    role,
    iat: dayjs().unix(),
    exp: expires,
    type,
    tokenVersion,
  };

  return jwt.sign(payload, secret);
};

/**
 * Verify JWT token
 */
const verifyToken = async (token, type) => {
  try {
    const payload = jwt.verify(token, config.jwt.secret);

    if (payload.type !== type) {
      throw new Error('Invalid token type');
    }

    return payload;
  } catch {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'Invalid token',
      'الرمز غير صالح',
    );
  }
};

/**
 * Generate authentication tokens
 */
const generateAuthTokens = async ({ userId, role }) => {
  const user = await users.findByPk(userId);

  if (!user) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'User not found',
      'المستخدم غير موجود',
    );
  }

  // Get current token_version from user (default to 0 if not set)
  const tokenVersion = user.token_version ?? 0;

  // Generate access token (short-lived)
  const accessTokenExpires = dayjs()
    .add(config.jwt.JWT_ACCESS_EXPIRATION_MINUTES, 'minutes')
    .unix();

  const accessToken = generateToken({
    userId,
    role,
    expires: accessTokenExpires,
    type: tokenTypes.ACCESS,
    tokenVersion,
  });

  // Generate refresh token (long-lived)
  const refreshTokenExpires = dayjs()
    .add(config.jwt.JWT_REFRESH_EXPIRATION_MINUTES, 'days')
    .unix();

  const refreshToken = generateToken({
    userId,
    role,
    expires: refreshTokenExpires,
    type: tokenTypes.REFRESH,
    tokenVersion,
  });

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires,
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires,
    },
  };
};

module.exports = {
  generateToken,
  verifyToken,
  generateAuthTokens,
};
