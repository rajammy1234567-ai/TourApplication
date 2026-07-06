const asyncHandler = require("../utils/asyncHandler");
const userService = require("../services/userService");

exports.getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user._id);
  res.json({ success: true, user });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  res.json({ success: true, message: "Profile updated", user });
});