const Booking = require("../models/Booking");
const ApiError = require("../utils/ApiError");
const hotelBookingService = require("./hotelBookingService");

const normalizeTourBooking = (booking) => ({
  ...booking,
  type: "tour",
  packageName: booking.packageName,
  startDate: booking.startDate,
  endDate: booking.endDate,
});

const normalizeHotelBooking = (booking) => ({
  ...booking,
  type: "hotel",
  packageName: booking.hotelId?.title || "Hotel Stay",
  startDate: booking.checkIn,
  endDate: booking.checkOut,
  remainingAmount: Math.max(0, (booking.totalAmount || 0) - (booking.paidAmount || 0)),
  travelers: booking.guests || 1,
  children: 0,
});

const getUserBookings = async (userId) => {
  if (!userId) {
    throw new ApiError(401, "Authentication required");
  }

  const [tourBookings, hotelBookings] = await Promise.all([
    Booking.find({ userId })
      .populate("tourId", "title image location duration people rating price packageId")
      .sort({ createdAt: -1 })
      .lean(),
    hotelBookingService.getUserHotelBookings(userId),
  ]);

  const normalizedTours = tourBookings.map(normalizeTourBooking);
  const normalizedHotels = hotelBookings.map(normalizeHotelBooking);
  const bookings = [...normalizedTours, ...normalizedHotels].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return {
    bookings,
    tourBookings: normalizedTours,
    hotelBookings: normalizedHotels,
  };
};

module.exports = { getUserBookings };