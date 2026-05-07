const Razorpay = require("razorpay");
const { assertRazorpayEnv } = require("./env");

const createRazorpayClient = () => {
  assertRazorpayEnv();

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

module.exports = createRazorpayClient;