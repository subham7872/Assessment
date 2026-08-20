const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { verifyAccessToken } = require('../utils/tokenUtils');
const userRepository = require('../repositories/userRepository');

const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new AppError('Not authenticated', 401);
  }

  const decoded = verifyAccessToken(token);
  const user = await userRepository.findById(decoded.userId);

  if (!user) {
    throw new AppError('User no longer exists', 401);
  }

  req.user = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };

  next();
});

module.exports = {
  protect,
};
