const asyncHandler = require("../utils/asyncHandler");
const notificationService = require("../services/notificationService");

exports.getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getUserNotifications(req.user._id);
  res.json({ success: true, ...result });
});

exports.markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markNotificationRead(
    req.user._id,
    req.params.id
  );
  if (!notification) {
    return res.status(404).json({ success: false, message: "Notification not found" });
  }
  res.json({ success: true, notification });
});

exports.markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllNotificationsRead(req.user._id);
  res.json({ success: true, message: "All notifications marked as read" });
});