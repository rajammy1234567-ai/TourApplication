const router = require("express").Router();
const { protect } = require("../middlewares/authMiddleware");
const userController = require("../controllers/userController");

router.get("/profile", protect, userController.getProfile);
router.put("/profile", protect, userController.updateProfile);

module.exports = router;