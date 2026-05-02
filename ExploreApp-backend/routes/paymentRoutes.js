const router = require("express").Router();
const { createOrder, verifyPayment } = require("../controllers/paymentController");
const { protect } = require("../middlewares/authMiddleware");

router.post("/create-order", protect, createOrder);
router.post("/verify", protect, verifyPayment);

module.exports = router;