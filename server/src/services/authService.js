const crypto = require('crypto');
const userRepository = require('../repositories/userRepository');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/tokenUtils');
const emailUtils = require('../utils/emailUtils');
const AppError = require('../utils/AppError');

class AuthService {
  async register({ name, email, password }) {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('Email already in use', 400);
    }

    const user = await userRepository.create({ name, email, password });

    const accessToken = generateAccessToken(user._id, user.email);
    const refreshToken = generateRefreshToken(user._id);

    user.addRefreshToken(refreshToken);
    await userRepository.save(user);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      accessToken,
      refreshToken,
    };
  }

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email, true);
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    const accessToken = generateAccessToken(user._id, user.email);
    const refreshToken = generateRefreshToken(user._id);

    user.addRefreshToken(refreshToken);
    user.lastLogin = new Date();
    await userRepository.save(user);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      accessToken,
      refreshToken,
    };
  }

  async logout(userId, refreshToken) {
    if (!userId) return true;
    const user = await userRepository.findById(userId);
    if (user) {
      user.removeRefreshToken(refreshToken);
      await userRepository.save(user);
    }
    return true;
  }

  async refreshAccessToken(refreshToken) {
    if (!refreshToken) {
      throw new AppError('No refresh token', 401);
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await userRepository.findById(decoded.userId);

    const tokenExists =
      user && user.refreshTokens.some((item) => item.token === refreshToken);
    if (!tokenExists) {
      throw new AppError('Invalid refresh token', 401);
    }

    const accessToken = generateAccessToken(user._id, user.email);
    return { accessToken };
  }

  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return true; // Silent return to prevent email enumeration
    }

    const rawToken = user.generatePasswordResetToken();
    await userRepository.save(user);

    try {
      await emailUtils.sendPasswordResetEmail(user.email, rawToken);
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await userRepository.save(user);
      throw new AppError('Email send failed', 500);
    }

    return true;
  }

  async resetPassword(rawToken, newPassword) {
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const user = await userRepository.findByPasswordResetToken(hashedToken);
    if (!user) {
      throw new AppError('Token invalid or expired', 400);
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokens = [];

    await userRepository.save(user);
    return true;
  }
}

module.exports = new AuthService();
