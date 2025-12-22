const catchAsync = require("../utils/catchAsync");
const httpStatus = require("http-status").default;
const { successResponse } = require("../utils/apiResponse");
const { userService, tokenService, authService } = require("../services");
const register = catchAsync(async (req, res) => {
  const user = req.body;
  const result = await userService.createUser(user);
  const token = await tokenService.generateAuthTokens({
    userId: result.id,
    role: result.role,
  });
  return successResponse(
    res,
    httpStatus.CREATED,
    "User registered successfully",
    "لقد تم تسجيل المستخدم بنجاح",
    result,
    token
  );
});
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.login(email, password);
  const token = await tokenService.generateAuthTokens({
    userId: user.id,
    role: user.role,
  });
  return successResponse(
    res,
    httpStatus.OK,
    "User logged in successfully",
    "لقد تم تسجيل المستخدم بنجاح",
    user,
    token
  );
});
const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  const token = await authService.refreshAuthToken(refreshToken);
  return successResponse(
    res,
    httpStatus.OK,
    "Token refreshed successfully",
    "تم تحديث الرمز المميز بنجاح",
    token
  );
});
const logout = catchAsync(async (req, res) => {
  // Best Practice: Logout requires valid access token (user must be authenticated)
  // If access token is expired, user is already effectively logged out
  const userId = req.user.id;
  const authHeader = req.headers.authorization;
  const accessToken = authHeader ? authHeader.split(' ')[1] : null;
  
  await authService.logout(userId, accessToken);
  return successResponse(
    res,
    httpStatus.OK,
    "Logged out successfully",
    "تم تسجيل الخروج بنجاح"
  );
});
module.exports = {
  register,
  login,
  refreshToken,
  logout,
};
