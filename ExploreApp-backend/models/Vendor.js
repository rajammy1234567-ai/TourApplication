const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    businessName: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    businessType: {
      type: String,
      enum: ["hotel", "tour", "both"],
      default: "both",
    },
    gstNumber: { type: String, trim: true },
    password: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    approvedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vendor", vendorSchema);