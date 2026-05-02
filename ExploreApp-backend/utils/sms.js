const axios = require('axios');

exports.sendPhoneOTP = async (phone, otp) => {
  await axios.get(
    `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.FAST2SMS_API_KEY}&route=otp&variables_values=${otp}&numbers=${phone}`
  );
};