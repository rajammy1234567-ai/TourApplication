const asyncHandler = require("../utils/asyncHandler");
const bookingService = require("../services/bookingService");
const hotelBookingService = require("../services/hotelBookingService");

exports.getMyBookings = asyncHandler(async (req, res) => {
  const result = await bookingService.getUserBookings(req.user?._id);
  res.json({ success: true, ...result });
});

exports.createHotelBooking = asyncHandler(async (req, res) => {
  const user = req.user;
  const booking = await hotelBookingService.createHotelBooking(user._id, {
    ...req.body,
    guestName: req.body.guestName || user.fullname,
    guestPhone: req.body.guestPhone || user.phone,
    guestEmail: req.body.guestEmail || user.email,
  });

  res.status(201).json({
    success: true,
    message: "Hotel reservation confirmed",
    booking,
  });
});