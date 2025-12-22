const httpStatus = require('http-status').default;
const bcrypt = require('bcryptjs');
const userService = require('./user.service');
const tokenService = require('./token.service');
const ApiError = require('../utils/ApiError');
const { tokenTypes } = require('../config/tokens');
const redisClient = require('../config/redis');

/**
 * Login with email and password
 */
async function login(email, password) {
  const user = await userService.getUserByEmail(email);

  if (!user) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'Invalid email or password',
      'البريد الإلكتروني أو كلمة المرور غير صحيحة'
    );
  }

  // Check if user is active
  if (!user.is_active || user.is_deleted) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'Your account is inactive',
      'حسابك غير نشط'
    );
  }

  // Verify password
  const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
  
  if (!isPasswordMatch) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'Invalid email or password',
      'البريد الإلكتروني أو كلمة المرور غير صحيحة'
    );
  }

  // Update last login
  await user.update({ last_login: new Date() });

  // Return user without sensitive data
  const userObj = user.get({ plain: true });
  delete userObj.password_hash;

  return userObj;
}

/**
 * Refresh authentication tokens
 */
async function refreshAuthToken(refreshToken) {
  try {
    // Verify refresh token
    const payload = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);

    // Get user
    const user = await userService.getUserById(payload.sub);

    if (!user) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        'User not found',
        'المستخدم غير موجود'
      );
    }

    // Check user status
    if (user.is_deleted || !user.is_active) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        'User account is inactive',
        'حساب المستخدم غير نشط'
      );
    }

    // Verify token version matches user's current token_version
    if (payload.tokenVersion !== undefined && payload.tokenVersion !== user.token_version) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        'Token has been revoked',
        'تم إلغاء الرمز المميز'
      );
    }

    // Check if token is blacklisted in Redis
    const isBlacklisted = await redisClient.get(`blacklist:${refreshToken}`);
    if (isBlacklisted) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        'Token has been revoked',
        'تم إلغاء الرمز المميز'
      );
    }

    // Generate new tokens with current token_version
    const tokens = await tokenService.generateAuthTokens({
      userId: user.id,
      role: user.role,
    });

    return tokens;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'Invalid refresh token',
      'رمز التحديث غير صالح'
    );
  }
}

/**
 * Logout user by revoking tokens
 * Best Practice: Requires valid access token (user must be authenticated)
 * 
 * Strategy:
 * 1. Increment token_version to invalidate ALL existing tokens (access + refresh)
 * 2. Optionally blacklist current access token in Redis for immediate revocation
 * 
 * Note: If access token is expired, user is already effectively logged out
 * and cannot make authenticated requests. The token_version increment ensures
 * refresh tokens are also invalidated.
 */
async function logout(userId, accessToken) {
  const user = await userService.getUserById(userId);

  if (!user) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'User not found',
      'المستخدم غير موجود'
    );
  }

  // Increment token_version to invalidate ALL existing tokens (access + refresh)
  // This is the primary revocation mechanism
  const newTokenVersion = (user.token_version || 0) + 1;
  await user.update({ token_version: newTokenVersion });

  // Optionally blacklist the current access token in Redis for immediate revocation
  // This provides an extra layer of security by preventing token reuse
  if (accessToken) {
    try {
      const tokenPayload = await tokenService.verifyToken(accessToken, tokenTypes.ACCESS);
      const expiresIn = tokenPayload.exp - Math.floor(Date.now() / 1000);
      
      // Only blacklist if token hasn't expired yet
      if (expiresIn > 0) {
        await redisClient.setEx(`blacklist:${accessToken}`, expiresIn, '1');
      }
    } catch (error) {
      // If token is invalid/expired, token_version increment is sufficient
      // This is fine - the token is already invalid
    }
  }

  return { success: true };
}

module.exports = {
  login,
  refreshAuthToken,
  logout,
};