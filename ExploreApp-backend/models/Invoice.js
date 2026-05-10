const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    customerName: String,
    customerEmail: String,
    packageName: String,
    totalAmount: Number,
    paidAmount: Number,
    remainingAmount: Number,
    paymentStatus: String,
    razorpayPaymentId: String,
    details: {
      travelers: Number,
      children: Number,
      startDate: Date,
      endDate: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);
