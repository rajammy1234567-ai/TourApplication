const router = require("express").Router();
const { protect } = require("../middlewares/authMiddleware");
const userController = require("../controllers/userController");
const notificationController = require("../controllers/notificationController");

router.get("/profile", protect, userController.getProfile);
router.put("/profile", protect, userController.updateProfile);

router.get("/notifications", protect, notificationController.getNotifications);
router.patch("/notifications/read-all", protect, notificationController.markAllRead);
router.patch("/notifications/:id/read", protect, notificationController.markRead);

module.exports = router;