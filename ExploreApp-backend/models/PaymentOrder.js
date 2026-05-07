const mongoose = require("mongoose");

const paymentOrderSchema = new mongoose.Schema(
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
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: "INR",
    },
    totalAmount: Number,
    paidAmount: Number,
    remainingAmount: Number,
    bookingDetails: {
      startDate: Date,
      endDate: Date,
      travelers: Number,
      children: Number,
      meal: Boolean,
      photo: Boolean,
      room: String,
    },
    status: {
      type: String,
      enum: ["created", "paid"],
      default: "created",
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentOrder", paymentOrderSchema);