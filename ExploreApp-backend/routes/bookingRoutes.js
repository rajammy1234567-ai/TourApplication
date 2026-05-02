const router = require("express").Router();
const { getMyBookings } = require("../controllers/bookingController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/my-bookings", protect, getMyBookings);

module.exports = router;