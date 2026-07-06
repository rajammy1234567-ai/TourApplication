const mongoose = require("mongoose");

const hotelBookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },
    guestName: { type: String, trim: true },
    guestPhone: { type: String, trim: true },
    guestEmail: { type: String, trim: true, lowercase: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    rooms: { type: Number, min: 1, default: 1 },
    guests: { type: Number, min: 1, default: 1 },
    roomType: { type: String, trim: true, default: "Standard" },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, required: true, min: 0 },
    bookingStatus: {
      type: String,
      enum: ["Confirmed", "Completed", "Cancelled"],
      default: "Confirmed",
    },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Pending"],
      default: "Paid",
    },
  },
  { timestamps: true }
);

hotelBookingSchema.index({ hotelId: 1, createdAt: -1 });
hotelBookingSchema.index({ checkIn: 1, checkOut: 1 });

module.exports = mongoose.model("HotelBooking", hotelBookingSchema);