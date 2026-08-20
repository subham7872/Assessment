const User = require('../models/User');

class UserRepository {
  async findById(id, selectFields = '') {
    return await User.findById(id).select(selectFields);
  }

  async findByEmail(email, includePassword = false) {
    const query = User.findOne({ email });
    if (includePassword) {
      query.select('+password');
    }
    return await query;
  }

  async findByRefreshToken(token) {
    return await User.findOne({ 'refreshTokens.token': token });
  }

  async findByPasswordResetToken(hashedToken) {
    return await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });
  }

  async create(userData) {
    return await User.create(userData);
  }

  async updateById(id, updateData) {
    return await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async save(userDocument) {
    return await userDocument.save();
  }
}

module.exports = new UserRepository();
