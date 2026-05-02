const crypto = require("crypto");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const Booking = require("../models/Booking");
const Tour = require("../models/Tour");
const createRazorpayClient = require("../config/razorpay");

const CURRENCY = "INR";

const toRupees = (value) => {
  if (typeof value === "number") return value;
  return Number(String(value || "").replace(/[^0-9.]/g, ""));
};

const findPackage = async (packageId) => {
  if (!packageId) return null;

  const filters = [{ packageId: String(packageId) }];

  if (mongoose.Types.ObjectId.isValid(packageId)) {
    filters.push({ _id: packageId });
  }

  return Tour.findOne({ $or: filters });
};

const getPaymentBreakdown = (price) => {
  const totalAmount = toRupees(price);

  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    throw new Error("Package price is invalid");
  }

  const paidAmount = Math.round(totalAmount * 0.1 * 100) / 100;
  const remainingAmount = Math.round((totalAmount - paidAmount) * 100) / 100;
  const razorpayAmount = Math.round(paidAmount * 100);

  return { totalAmount, paidAmount, remainingAmount, razorpayAmount };
};

const isSignatureValid = ({ orderId, paymentId, signature }) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!secret || !orderId || !paymentId || !signature) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");

  return (
    expectedBuffer.length === signatureBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
  );
};

exports.createOrder = async (req, res) => {
  try {
    const { packageId, userId } = req.body;
    const authenticatedUserId = req.user._id.toString();

    if (!packageId) {
      return res.status(400).json({ success: false, message: "packageId is required" });
    }

    if (userId && userId !== authenticatedUserId) {
      return res.status(403).json({ success: false, message: "Cannot create order for another user" });
    }

    const tourPackage = await findPackage(packageId);

    if (!tourPackage) {
      return res.status(404).json({ success: false, message: "Package not found" });
    }

    const { totalAmount, paidAmount, remainingAmount, razorpayAmount } =
      getPaymentBreakdown(tourPackage.price);

    const razorpay = createRazorpayClient();
    const order = await razorpay.orders.create({
      amount: razorpayAmount,
      currency: CURRENCY,
      receipt: `tour_${uuidv4()}`,
      notes: {
        packageId: String(packageId),
        userId: authenticatedUserId,
        totalAmount: String(totalAmount),
        remainingAmount: String(remainingAmount),
      },
    });

    return res.status(201).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paidAmount,
      remainingAmount,
      totalAmount,
      keyId: process.env.RAZORPAY_KEY_ID,
      packageName: tourPackage.title,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      packageId,
    } = req.body;
    const authenticatedUserId = req.user._id.toString();

    if (userId && userId !== authenticatedUserId) {
      return res.status(403).json({ success: false, message: "Cannot verify payment for another user" });
    }

    const valid = isSignatureValid({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!valid) {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    const existingBooking = await Booking.findOne({
      razorpayPaymentId: razorpay_payment_id,
    });

    if (existingBooking) {
      return res.json({ success: true, message: "Booking already confirmed", booking: existingBooking });
    }

    const tourPackage = await findPackage(packageId);

    if (!tourPackage) {
      return res.status(404).json({ success: false, message: "Package not found" });
    }

    const { totalAmount, paidAmount, remainingAmount } =
      getPaymentBreakdown(tourPackage.price);

    const booking = await Booking.create({
      userId: authenticatedUserId,
      packageId: String(packageId),
      packageName: tourPackage.title,
      totalAmount,
      paidAmount,
      remainingAmount,
      paymentStatus: "Paid",
      bookingStatus: "Confirmed",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    return res.status(201).json({
      success: true,
      message: "Booking confirmed",
      booking,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Payment has already been booked" });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
}