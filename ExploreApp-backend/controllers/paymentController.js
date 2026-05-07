const asyncHandler = require("../utils/asyncHandler");
const paymentService = require("../services/paymentService");

exports.createOrder = asyncHandler(async (req, res) => {
  const order = await paymentService.createOrder({
    tourId: req.body.tourId || req.body.packageId,
    userId: req.body.userId,
    authenticatedUserId: req.user._id,
    bookingDetails: req.body.bookingDetails,
  });

  res.status(201).json({ success: true, ...order });
});

exports.verifyPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.verifyPaymentAndCreateBooking({
    razorpay_order_id: req.body.razorpay_order_id,
    razorpay_payment_id: req.body.razorpay_payment_id,
    razorpay_signature: req.body.razorpay_signature,
    userId: req.body.userId,
    tourId: req.body.tourId || req.body.packageId,
    authenticatedUserId: req.user._id,
  });

  res.status(result.alreadyConfirmed ? 200 : 201).json({
    success: true,
    message: result.alreadyConfirmed ? "Booking already confirmed" : "Booking confirmed",
    booking: result.booking,
  });
});