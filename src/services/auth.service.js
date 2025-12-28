const httpStatus = require("http-status").default;
const bcrypt = require("bcryptjs");
const userService = require("./user.service");
const tokenService = require("./token.service");
const ApiError = require("../utils/ApiError");
const { tokenTypes } = require("../config/tokens");
const redisClient = require("../config/redis");
const {
  emailIpBruteLimiter,
  slowerBruteLimiter,
  emailBruteLimiter,
} = require("../middlewares/authLimiter");
async function login(email, password, ipAddress) {
  // Consume slower brute limiter first (IP-based)
  try {
    await slowerBruteLimiter.consume(ipAddress);
  } catch (rejRes) {
    // Rate limit exceeded for this IP
    const retrySeconds = Math.floor(rejRes.msBeforeNext / 1000);
    throw new ApiError(
      httpStatus.TOO_MANY_REQUESTS,
      "Too many requests from this IP",
      "عدد كبير من المحاولات من هذا العنوان",
      true,
      retrySeconds
    );
  }

  // Consume email brute limiter (email-based across all IPs)
  try {
    await emailBruteLimiter.consume(email);
  } catch (rejRes) {
    // Rate limit exceeded for this email
    const retrySeconds = Math.floor(rejRes.msBeforeNext / 1000);
    throw new ApiError(
      httpStatus.TOO_MANY_REQUESTS,
      "Too many attempts for this email address",
      "عدد كبير من المحاولات لهذا البريد الإلكتروني",
      true,
      retrySeconds
    );
  }

  // Get user
  const user = await userService.getUserByEmail(email);

  // Check if user exists
  if (!user) {
    // Consume email+IP limiter for failed attempt
    try {
      await emailIpBruteLimiter.consume(`${email}_${ipAddress}`);
    } catch (rejRes) {
      const retrySeconds = Math.floor(rejRes.msBeforeNext / 1000);
      throw new ApiError(
        httpStatus.TOO_MANY_REQUESTS,
        "Too many failed attempts for this account from your IP",
        "عدد كبير من المحاولات الفاشلة لهذا الحساب من عنوان IP الخاص بك",
        true,
        retrySeconds
      );
    }

    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Invalid email or password",
      "البريد الإلكتروني أو كلمة المرور غير صحيحة"
    );
  }

  // Check if user is active
  if (!user.is_active || user.is_deleted) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Your account is inactive",
      "حسابك غير نشط"
    );
  }

  // Verify password
  const isPasswordMatch = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordMatch) {
    // Consume email+IP limiter for failed attempt
    try {
      await emailIpBruteLimiter.consume(`${email}_${ipAddress}`);
    } catch (rejRes) {
      const retrySeconds = Math.floor(rejRes.msBeforeNext / 1000);
      throw new ApiError(
        httpStatus.TOO_MANY_REQUESTS,
        "Too many failed attempts for this account from your IP",
        "عدد كبير من المحاولات الفاشلة لهذا الحساب من عنوان IP الخاص بك",
        true,
        retrySeconds
      );
    }

    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Invalid email or password",
      "البريد الإلكتروني أو كلمة المرور غير صحيحة"
    );
  }

  // Successful login - reset counters
  try {
    await Promise.all([
      emailIpBruteLimiter.delete(`${email}_${ipAddress}`),
      emailBruteLimiter.delete(email),
    ]);
  } catch {
    // Ignore deletion errors
  }

  // Update last login
  await user.update({ last_login: new Date() });

  // Return user without sensitive data
  const userObj = user.get({ plain: true });
  delete userObj.password_hash;
  return userObj;
}

async function refreshAuthToken(refreshToken) {
  try {
    // Verify refresh token
    const payload = await tokenService.verifyToken(
      refreshToken,
      tokenTypes.REFRESH
    );

    // Get user
    const user = await userService.getUserById(payload.sub);

    if (!user) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "User not found",
        "المستخدم غير موجود"
      );
    }

    // Check user status
    if (user.is_deleted || !user.is_active) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "User account is inactive",
        "حساب المستخدم غير نشط"
      );
    }

    // Verify token version matches user's current token_version
    if (
      payload.tokenVersion !== undefined &&
      payload.tokenVersion !== user.token_version
    ) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Token has been revoked",
        "تم إلغاء الرمز المميز"
      );
    }

    // Check if token is blacklisted in Redis
    const isBlacklisted = await redisClient.get(`blacklist:${refreshToken}`);
    if (isBlacklisted) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Token has been revoked",
        "تم إلغاء الرمز المميز"
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
      "Invalid refresh token",
      "رمز التحديث غير صالح"
    );
  }
}
async function logout(userId, accessToken) {
  const user = await userService.getUserById(userId);

  if (!user) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "User not found",
      "المستخدم غير موجود"
    );
  }
  const newTokenVersion = (user.token_version || 0) + 1;
  await user.update({ token_version: newTokenVersion });
  if (accessToken) {
    try {
      const tokenPayload = await tokenService.verifyToken(
        accessToken,
        tokenTypes.ACCESS
      );
      const expiresIn = tokenPayload.exp - Math.floor(Date.now() / 1000);

      if (expiresIn > 0) {
        await redisClient.setEx(`blacklist:${accessToken}`, expiresIn, "1");
      }
    } catch (err){
      if(process.env.NODE_ENV === 'development'){
        console.warn(err);
      }
    }
  }

  return { success: true };
}

module.exports = {
  login,
  refreshAuthToken,
  logout,
};
