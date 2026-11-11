import httpStatus from 'http-status';
import { catchAsync } from '../utils/catchAsync';
import { successResponse } from '../utils/apiResponse';
import { userService, tokenService, authService } from '../services';

export const register = catchAsync(async (req, res) => {
  const user = req.body;
  const result = await userService.createUser(user);
  const token = await tokenService.generateAuthTokens({
    userId: result.id,
    role: result.role,
  });
  return successResponse(
    res,
    httpStatus.CREATED,
    'User registered successfully',
    'لقد تم تسجيل المستخدم بنجاح',
    result,
    token,
  );
});

export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.ip ?? 'unknown';
  const user = await authService.login(email, password, ipAddress);
  const token = await tokenService.generateAuthTokens({
    userId: user.id,
    role: user.role,
  });
  return successResponse(
    res,
    httpStatus.OK,
    'User logged in successfully',
    'لقد تم تسجيل الدخول بنجاح',
    user,
    token,
  );
});

export const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken: refreshTokenValue } = req.body;
  const token = await authService.refreshAuthToken(refreshTokenValue);
  return successResponse(
    res,
    httpStatus.OK,
    'Token refreshed successfully',
    'تم تحديث الرمز المميز بنجاح',
    token,
  );
});

export const logout = catchAsync(async (req, res) => {
  const userId = req.user!.id;
  const authHeader = req.headers.authorization;
  const accessToken = authHeader ? authHeader.split(' ')[1] ?? null : null;

  await authService.logout(userId, accessToken);
  return successResponse(
    res,
    httpStatus.OK,
    'Logged out successfully',
    'تم تسجيل الخروج بنجاح',
  );
});

export const authController = {
  register,
  login,
  refreshToken,
  logout,
};
