const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    trim: true,
    required: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true,
  },
  password: String,
  phone: {
    type: String,
    trim: true,
    unique: true,
    sparse: true,
  },
  authProvider: {
    type: String,
    enum: ["local", "google", "apple"],
    default: "local",
  },
  providerId: String,
  avatar: String,

   otp: String,
  otpExpiry: Date,
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);