const asyncHandler = require("../utils/asyncHandler");
const bookingService = require("../services/bookingService");

exports.getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await bookingService.getUserBookings(req.user?._id);

  res.json({ success: true, bookings });
});