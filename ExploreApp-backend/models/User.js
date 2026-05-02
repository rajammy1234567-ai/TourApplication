const mogoose = require('mongoose');

const userSchema = new mogoose.Schema({
  fullname: String,
  email :  String,
password : String,
  phone : String,
  authProvider: {
    type: String,
    enum: ["local", "google", "apple"],
    default: "local",
  },
  providerId: String,
  avatar: String,

  otp : String,
  otpExpiry : String
});

module.exports = mogoose.model("User", userSchema);