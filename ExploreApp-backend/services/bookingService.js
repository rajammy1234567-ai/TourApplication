const Booking = require("../models/Booking");
const ApiError = require("../utils/ApiError");

const getUserBookings = async (userId) => {
  if (!userId) {
    throw new ApiError(401, "Authentication required");
  }

  return Booking.find({ userId })
    .populate("tourId", "title image location duration people rating price packageId")
    .sort({ createdAt: -1 })
    .lean();
};

module.exports = { getUserBookings };