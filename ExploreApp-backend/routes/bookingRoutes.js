const router = require("express").Router();
const {
  getMyBookings,
  createHotelBooking,
  createDemoTourBooking,
} = require("../controllers/bookingController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/my-bookings", protect, getMyBookings);
router.post("/hotel", protect, createHotelBooking);
router.post("/tour-demo", protect, createDemoTourBooking);

module.exports = router;