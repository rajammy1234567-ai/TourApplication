const ApiError = require("../utils/ApiError");

const requiredEnv = ["MONGODB_URI", "JWT_SECRET_KEY"];
const paymentEnv = ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"];

const validateEnv = () => {
  const missing = requiredEnv.filter((key) => !process.env[key]);

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  const missingPayment = paymentEnv.filter((key) => !process.env[key]);
  if (missingPayment.length) {
    console.warn(
      `Razorpay is not fully configured. Payment routes will fail until these variables are set: ${missingPayment.join(", ")}`
    );
  }
};

const assertRazorpayEnv = () => {
  const missing = paymentEnv.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new ApiError(500, "Payment gateway is not configured");
  }
};

module.exports = { validateEnv, assertRazorpayEnv };