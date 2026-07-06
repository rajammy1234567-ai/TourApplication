const mongoose = require("mongoose");

const hotelSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    location: { type: String, trim: true, index: true },
    city: { type: String, trim: true, index: true },
    state: { type: String, trim: true },
    propertyType: {
      type: String,
      enum: ["hotel", "apartment", "villa", "resort", "homestay", "hostel"],
      default: "hotel",
    },
    image: String,
    gallery: [String],
    pricePerNight: { type: Number, required: true, min: 0 },
    bedrooms: { type: Number, default: 1, min: 0 },
    bathrooms: { type: Number, default: 1, min: 0 },
    maxGuests: { type: Number, default: 2, min: 1 },
    amenities: [String],
    rating: { type: Number, min: 0, max: 5, default: 0 },
    checkInTime: { type: String, default: "14:00" },
    checkOutTime: { type: String, default: "11:00" },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    latitude: Number,
    longitude: Number,
  },
  { timestamps: true }
);

hotelSchema.index({ title: "text", location: "text", city: "text" });

module.exports = mongoose.model("Hotel", hotelSchema);