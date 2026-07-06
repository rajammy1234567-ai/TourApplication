const Hotel = require("../models/Hotel");
const HotelBooking = require("../models/HotelBooking");
const ApiError = require("../utils/ApiError");
const { createUserNotification } = require("./notificationService");

const createHotelBooking = async (userId, data) => {
  const {
    hotelId,
    checkIn,
    checkOut,
    rooms = 1,
    guests = 1,
    guestName,
    guestPhone,
    guestEmail,
    roomType = "Standard",
  } = data;

  if (!hotelId || !checkIn || !checkOut) {
    throw new ApiError(400, "hotelId, checkIn and checkOut are required");
  }

  const hotel = await Hotel.findOne({ _id: hotelId, status: "approved" });
  if (!hotel) {
    throw new ApiError(404, "Hotel not found or not available");
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  if (
    Number.isNaN(checkInDate.getTime()) ||
    Number.isNaN(checkOutDate.getTime()) ||
    checkOutDate <= checkInDate
  ) {
    throw new ApiError(400, "Invalid check-in or check-out dates");
  }

  const nights = Math.max(
    1,
    Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / 86400000)
  );
  const roomCount = Math.max(1, Number(rooms) || 1);
  const guestCount = Math.max(1, Number(guests) || 1);
  const totalAmount = Math.round(nights * hotel.pricePerNight * roomCount);
  const paidAmount = Math.round(totalAmount * 0.1 * 100) / 100;

  const booking = await HotelBooking.create({
    userId,
    hotelId,
    guestName: guestName?.trim(),
    guestPhone: guestPhone?.trim(),
    guestEmail: guestEmail?.trim()?.toLowerCase(),
    checkIn: checkInDate,
    checkOut: checkOutDate,
    rooms: roomCount,
    guests: guestCount,
    roomType: roomType?.trim() || "Standard",
    totalAmount,
    paidAmount,
    bookingStatus: "Confirmed",
    paymentStatus: "Paid",
  });

  await createUserNotification({
    userId,
    type: "booking_hotel",
    title: "Hotel booking confirmed",
    body: `Your stay at ${hotel.title} is confirmed from ${checkInDate.toLocaleDateString("en-IN")} to ${checkOutDate.toLocaleDateString("en-IN")}.`,
    link: "/myBookings",
    meta: { bookingId: booking._id, hotelId: hotel._id },
  });

  return HotelBooking.findById(booking._id)
    .populate("hotelId", "title image city location pricePerNight propertyType")
    .lean();
};

const getUserHotelBookings = async (userId) => {
  return HotelBooking.find({ userId })
    .populate("hotelId", "title image city location pricePerNight propertyType")
    .sort({ createdAt: -1 })
    .lean();
};

module.exports = {
  createHotelBooking,
  getUserHotelBookings,
};