const router = require("express").Router();
const { getMyBookings, createHotelBooking } = require("../controllers/bookingController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/my-bookings", protect, getMyBookings);
router.post("/hotel", protect, createHotelBooking);

module.exports = router;