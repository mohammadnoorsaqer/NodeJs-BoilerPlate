import httpStatus from 'http-status';
import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories';
import { tokenService } from './token.service';
import { ApiError } from '../utils/ApiError';
import { tokenTypes } from '../config/tokens';
import redisClient from '../config/redis';
import type { SafeUser } from '../repositories/user.repository';
import {
  emailIpBruteLimiter,
  slowerBruteLimiter,
  emailBruteLimiter,
} from '../middlewares/authLimiter';

async function login(
  email: string,
  password: string,
  ipAddress: string,
): Promise<SafeUser> {
  try {
    await slowerBruteLimiter.consume(ipAddress);
  } catch (rejRes) {
    const msBeforeNext = (rejRes as { msBeforeNext: number }).msBeforeNext;
    const retrySeconds = Math.floor(msBeforeNext / 1000);
    throw new ApiError(
      httpStatus.TOO_MANY_REQUESTS,
      'Too many requests from this IP',
      'عدد كبير من المحاولات من هذا العنوان',
      true,
      retrySeconds,
    );
  }

  try {
    await emailBruteLimiter.consume(email);
  } catch (rejRes) {
    const msBeforeNext = (rejRes as { msBeforeNext: number }).msBeforeNext;
    const retrySeconds = Math.floor(msBeforeNext / 1000);
    throw new ApiError(
      httpStatus.TOO_MANY_REQUESTS,
      'Too many attempts for this email address',
      'عدد كبير من المحاولات لهذا البريد الإلكتروني',
      true,
      retrySeconds,
    );
  }

  const user = await userRepository.getUserByEmail(email);

  if (!user) {
    try {
      await emailIpBruteLimiter.consume(`${email}_${ipAddress}`);
    } catch (rejRes) {
      const msBeforeNext = (rejRes as { msBeforeNext: number }).msBeforeNext;
      const retrySeconds = Math.floor(msBeforeNext / 1000);
      throw new ApiError(
        httpStatus.TOO_MANY_REQUESTS,
        'Too many failed attempts for this account from your IP',
        'عدد كبير من المحاولات الفاشلة لهذا الحساب من عنوان IP الخاص بك',
        true,
        retrySeconds,
      );
    }

    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'Invalid email or password',
      'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    );
  }

  if (!user.is_active || user.is_deleted) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'Your account is inactive',
      'حسابك غير نشط',
    );
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password_hash ?? '');

  if (!isPasswordMatch) {
    try {
      await emailIpBruteLimiter.consume(`${email}_${ipAddress}`);
    } catch (rejRes) {
      const msBeforeNext = (rejRes as { msBeforeNext: number }).msBeforeNext;
      const retrySeconds = Math.floor(msBeforeNext / 1000);
      throw new ApiError(
        httpStatus.TOO_MANY_REQUESTS,
        'Too many failed attempts for this account from your IP',
        'عدد كبير من المحاولات الفاشلة لهذا الحساب من عنوان IP الخاص بك',
        true,
        retrySeconds,
      );
    }

    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'Invalid email or password',
      'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    );
  }

  try {
    await Promise.all([
      emailIpBruteLimiter.delete(`${email}_${ipAddress}`),
      emailBruteLimiter.delete(email),
    ]);
  } catch {
    // Ignore deletion errors
  }

  await user.update({ last_login: new Date() });

  const userObj = user.get({ plain: true });
  const { password_hash: _passwordHash, ...safeUser } = userObj;
  return safeUser;
}

async function refreshAuthToken(refreshToken: string) {
  try {
    const payload = await tokenService.verifyToken(
      refreshToken,
      tokenTypes.REFRESH,
    );

    const user = await userRepository.getUserById(payload.sub);

    if (!user) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        'User not found',
        'المستخدم غير موجود',
      );
    }

    if (user.is_deleted || !user.is_active) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        'User account is inactive',
        'حساب المستخدم غير نشط',
      );
    }

    if (
      payload.tokenVersion !== undefined &&
      payload.tokenVersion !== user.token_version
    ) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        'Token has been revoked',
        'تم إلغاء الرمز المميز',
      );
    }

    const isBlacklisted = await redisClient.get(`blacklist:${refreshToken}`);
    if (isBlacklisted) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        'Token has been revoked',
        'تم إلغاء الرمز المميز',
      );
    }

    return tokenService.generateAuthTokens({
      userId: user.id,
      role: user.role,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'Invalid refresh token',
      'رمز التحديث غير صالح',
    );
  }
}

async function logout(userId: string, accessToken: string | null) {
  const user = await userRepository.getUserById(userId);

  if (!user) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'User not found',
      'المستخدم غير موجود',
    );
  }

  const newTokenVersion = (user.token_version || 0) + 1;
  await user.update({ token_version: newTokenVersion });

  if (accessToken) {
    try {
      const tokenPayload = await tokenService.verifyToken(
        accessToken,
        tokenTypes.ACCESS,
      );
      const expiresIn = tokenPayload.exp - Math.floor(Date.now() / 1000);

      if (expiresIn > 0) {
        await redisClient.setEx(`blacklist:${accessToken}`, expiresIn, '1');
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(err);
      }
    }
  }

  return { success: true as const };
}

export const authService = {
  login,
  refreshAuthToken,
  logout,
};
