const Notification = require("../models/Notification");

const createUserNotification = async ({ userId, type, title, body, link, meta }) => {
  if (!userId || !title || !body) return null;

  try {
    return await Notification.create({
      userId,
      type: type || "general",
      title,
      body,
      link,
      meta,
    });
  } catch (error) {
    console.error("Failed to create notification:", error.message);
    return null;
  }
};

const getUserNotifications = async (userId, { limit = 50 } = {}) => {
  const notifications = await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const unreadCount = await Notification.countDocuments({ userId, read: false });

  return { notifications, unreadCount };
};

const markNotificationRead = async (userId, notificationId) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { read: true },
    { new: true }
  ).lean();
};

const markAllNotificationsRead = async (userId) => {
  await Notification.updateMany({ userId, read: false }, { read: true });
  return { success: true };
};

module.exports = {
  createUserNotification,
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};