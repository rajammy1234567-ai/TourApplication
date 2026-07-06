const User = require("../models/User");
const ApiError = require("../utils/ApiError");

const toSafeUser = (user) => ({
  _id: user._id,
  fullname: user.fullname,
  email: user.email,
  phone: user.phone,
  avatar: user.avatar,
  authProvider: user.authProvider,
});

const getProfile = async (userId) => {
  const user = await User.findById(userId).select("-password -otp -otpExpiry");
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return toSafeUser(user);
};

const updateProfile = async (userId, data) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const { fullname, phone, avatar } = data;
  if (fullname !== undefined) user.fullname = String(fullname).trim();
  if (phone !== undefined) user.phone = String(phone).trim();
  if (avatar !== undefined) user.avatar = String(avatar).trim();

  await user.save();
  return toSafeUser(user);
};

module.exports = {
  getProfile,
  updateProfile,
  toSafeUser,
};