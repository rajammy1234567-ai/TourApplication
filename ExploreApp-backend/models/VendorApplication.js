const mongoose = require("mongoose");

const vendorApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    businessName: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
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
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    adminNotes: { type: String, trim: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    reviewedAt: Date,
  },
  { timestamps: true }
);

vendorApplicationSchema.index({ phone: 1, status: 1 });

module.exports = mongoose.model("VendorApplication", vendorApplicationSchema);