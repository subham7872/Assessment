const authService = require('../services/authService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

const getClearCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
});

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.register({
    name,
    email,
    password,
  });

  res.cookie('refreshToken', refreshToken, getCookieOptions());
  return ApiResponse.success(
    res,
    201,
    { user, accessToken },
    'Registered successfully'
  );
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.login({
    email,
    password,
  });

  res.cookie('refreshToken', refreshToken, getCookieOptions());
  return ApiResponse.success(
    res,
    200,
    { user, accessToken },
    'Login successful'
  );
});

const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  await authService.logout(req.user?.id, refreshToken);

  res.clearCookie('refreshToken', getClearCookieOptions());

  return ApiResponse.success(res, 200, null, 'Logged out');
});

const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  const data = await authService.refreshAccessToken(token);

  return ApiResponse.success(res, 200, data, 'Token refreshed');
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.forgotPassword(email);

  return ApiResponse.success(
    res,
    200,
    null,
    'If email exists, reset link sent'
  );
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  await authService.resetPassword(token, password);

  res.clearCookie('refreshToken', getClearCookieOptions());

  return ApiResponse.success(res, 200, null, 'Password reset successful');
});

const getMe = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, 200, { user: req.user }, 'User fetched');
});

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
};
