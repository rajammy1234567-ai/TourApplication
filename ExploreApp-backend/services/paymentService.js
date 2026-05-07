const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const Booking = require("../models/Booking");
const PaymentOrder = require("../models/PaymentOrder");
const createRazorpayClient = require("../config/razorpay");
const { assertRazorpayEnv } = require("../config/env");
const { getTourById } = require("./tourService");
const ApiError = require("../utils/ApiError");

const CURRENCY = "INR";
const ADVANCE_PERCENTAGE = 0.1;

const toRupees = (value) => {
  if (typeof value === "number") return value;
  return Number(String(value || "").replace(/[^0-9.]/g, ""));
};

const normalizeBookingDetails = (details = {}) => {
  const travelers = Math.max(1, Number.parseInt(details.travelers, 10) || 1);
  const children = Math.max(0, Number.parseInt(details.children, 10) || 0);
  const startDate = details.startDate ? new Date(details.startDate) : null;
  const endDate = details.endDate ? new Date(details.endDate) : null;

  if (!startDate || Number.isNaN(startDate.getTime())) {
    throw new ApiError(400, "Valid startDate is required");
  }

  if (!endDate || Number.isNaN(endDate.getTime())) {
    throw new ApiError(400, "Valid endDate is required");
  }

  if (endDate < startDate) {
    throw new ApiError(400, "endDate must be on or after startDate");
  }

  return {
    startDate,
    endDate,
    travelers,
    children,
    meal: Boolean(details.meal),
    photo: Boolean(details.photo),
    room: String(details.room || "").trim().slice(0, 80),
  };
};

const calculateBookingTotal = (price, details) => {
  const basePrice = toRupees(price);

  if (!Number.isFinite(basePrice) || basePrice <= 0) {
    throw new ApiError(400, "Tour package price is invalid");
  }

  const totalPeople = details.travelers + details.children;
  const adultsTotal = details.travelers * basePrice;
  const childTotal = details.children * (basePrice * 0.5);
  const mealTotal = details.meal ? totalPeople * 80 : 0;
  const photoTotal = details.photo ? totalPeople * 50 : 0;
  const taxes = (adultsTotal + childTotal) * 0.075;

  return Math.round((adultsTotal + childTotal + mealTotal + photoTotal + taxes) * 100) / 100;
};

const getPaymentBreakdown = (price, bookingDetails) => {
  const totalAmount = bookingDetails
    ? calculateBookingTotal(price, bookingDetails)
    : toRupees(price);

  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    throw new ApiError(400, "Tour package price is invalid");
  }

  const paidAmount = Math.round(totalAmount * ADVANCE_PERCENTAGE * 100) / 100;
  const remainingAmount = Math.round((totalAmount - paidAmount) * 100) / 100;
  const razorpayAmount = Math.round(paidAmount * 100);

  if (!Number.isInteger(razorpayAmount) || razorpayAmount <= 0) {
    throw new ApiError(400, "Payment amount must be a positive integer in paise");
  }

  return { totalAmount, paidAmount, remainingAmount, razorpayAmount };
};

const assertSameUser = (payloadUserId, authenticatedUserId) => {
  if (payloadUserId && String(payloadUserId) !== String(authenticatedUserId)) {
    throw new ApiError(403, "Cannot perform payment action for another user");
  }
};

const createOrder = async ({ tourId, userId, authenticatedUserId, bookingDetails }) => {
  assertSameUser(userId, authenticatedUserId);
  assertRazorpayEnv();

  if (!tourId) {
    throw new ApiError(400, "tourId is required");
  }

  const tour = await getTourById(tourId);
  const normalizedBookingDetails = normalizeBookingDetails(bookingDetails);
  const { totalAmount, paidAmount, remainingAmount, razorpayAmount } =
    getPaymentBreakdown(tour.price, normalizedBookingDetails);

  const razorpay = createRazorpayClient();

  try {
    const order = await razorpay.orders.create({
      amount: razorpayAmount,
      currency: CURRENCY,
      receipt: `tour_${uuidv4().replace(/-/g, "").slice(0, 32)}`,
      notes: {
        tourId: String(tour._id),
        packageId: String(tour.packageId || ""),
        userId: String(authenticatedUserId),
        totalAmount: String(totalAmount),
        remainingAmount: String(remainingAmount),
      },
    });

    await PaymentOrder.create({
      userId: authenticatedUserId,
      tourId: tour._id,
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      totalAmount,
      paidAmount,
      remainingAmount,
      bookingDetails: normalizedBookingDetails,
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paidAmount,
      remainingAmount,
      totalAmount,
      keyId: process.env.RAZORPAY_KEY_ID,
      tourId: String(tour._id),
      packageName: tour.title,
    };
  } catch (error) {
    console.error("Razorpay order creation failed", {
      message: error.message,
      statusCode: error.statusCode,
      error,
    });
    throw new ApiError(502, "Payment gateway failed to create an order");
  }
};

const isSignatureValid = ({ orderId, paymentId, signature }) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !orderId || !paymentId || !signature) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureBuffer = Buffer.from(String(signature), "hex");

  return (
    expectedBuffer.length === signatureBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
  );
};

const verifyPaymentAndCreateBooking = async ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  userId,
  tourId,
  authenticatedUserId,
}) => {
  assertSameUser(userId, authenticatedUserId);

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(400, "Razorpay order id, payment id, and signature are required");
  }

  if (!isSignatureValid({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  })) {
    throw new ApiError(400, "Payment signature verification failed");
  }

  const existingBooking = await Booking.findOne({
    razorpayPaymentId: razorpay_payment_id,
  }).lean();

  if (existingBooking) {
    return { booking: existingBooking, alreadyConfirmed: true };
  }

  const paymentOrder = await PaymentOrder.findOne({
    razorpayOrderId: razorpay_order_id,
    userId: authenticatedUserId,
    status: "created",
  });

  if (!paymentOrder) {
    throw new ApiError(404, "Payment order was not found or has already been processed");
  }

  const tour = await getTourById(tourId || paymentOrder.tourId);

  if (String(paymentOrder.tourId) !== String(tour._id)) {
    throw new ApiError(400, "Payment order does not belong to this tour");
  }

  const totalAmount = paymentOrder.totalAmount;
  const paidAmount = paymentOrder.paidAmount;
  const remainingAmount = paymentOrder.remainingAmount;

  try {
    const booking = await Booking.create({
      userId: authenticatedUserId,
      tourId: tour._id,
      packageIdSnapshot: tour.packageId,
      packageName: tour.title,
      startDate: paymentOrder.bookingDetails.startDate,
      endDate: paymentOrder.bookingDetails.endDate,
      travelers: paymentOrder.bookingDetails.travelers,
      children: paymentOrder.bookingDetails.children,
      meal: paymentOrder.bookingDetails.meal,
      photo: paymentOrder.bookingDetails.photo,
      room: paymentOrder.bookingDetails.room,
      totalAmount,
      paidAmount,
      remainingAmount,
      paymentStatus: "Paid",
      bookingStatus: "Confirmed",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    paymentOrder.status = "paid";
    await paymentOrder.save();

    return { booking, alreadyConfirmed: false };
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, "This payment has already been used for a booking");
    }
    throw error;
  }
};

module.exports = { createOrder, verifyPaymentAndCreateBooking };