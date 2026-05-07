const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tour",
      required: true,
      index: true,
    },
    packageIdSnapshot: {
      type: String,
      index: true,
    },
    packageName: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: Date,
    endDate: Date,
    travelers: {
      type: Number,
      min: 1,
      default: 1,
    },
    children: {
      type: Number,
      min: 0,
      default: 0,
    },
    meal: {
      type: Boolean,
      default: false,
    },
    photo: {
      type: Boolean,
      default: false,
    },
    room: String,
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["Paid"],
      default: "Paid",
    },
    bookingStatus: {
      type: String,
      enum: ["Confirmed"],
      default: "Confirmed",
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpaySignature: {
      type: String,
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);


bookingSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Booking", bookingSchema);