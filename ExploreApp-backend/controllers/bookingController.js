const asyncHandler = require("../utils/asyncHandler");
const bookingService = require("../services/bookingService");
const hotelBookingService = require("../services/hotelBookingService");
const paymentService = require("../services/paymentService");

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

exports.createDemoTourBooking = asyncHandler(async (req, res) => {
  const booking = await paymentService.createDemoTourBooking({
    tourId: req.body.tourId || req.body.packageId,
    authenticatedUserId: req.user._id,
    bookingDetails: req.body.bookingDetails,
  });

  res.status(201).json({
    success: true,
    message: "Tour booking confirmed (demo mode)",
    booking,
  });
});