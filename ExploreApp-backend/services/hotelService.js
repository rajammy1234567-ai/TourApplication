const Hotel = require("../models/Hotel");
const ApiError = require("../utils/ApiError");

const getHotels = async ({ search, city, propertyType, page = 1, limit = 20 } = {}) => {
  const filter = { status: "approved" };

  if (search) {
    filter.$text = { $search: String(search) };
  }
  if (city) {
    filter.city = new RegExp(String(city), "i");
  }
  if (propertyType) {
    filter.propertyType = propertyType;
  }

  const skip = (page - 1) * limit;

  return Hotel.find(filter)
    .select("-__v")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

const getHotelById = async (hotelId) => {
  const hotel = await Hotel.findOne({ _id: hotelId, status: "approved" }).lean();
  if (!hotel) {
    throw new ApiError(404, "Hotel not found");
  }
  return hotel;
};

const createHotel = async (vendorId, data) => {
  return Hotel.create({
    ...data,
    vendorId,
    status: "pending",
  });
};

const updateHotel = async (vendorId, hotelId, data) => {
  const hotel = await Hotel.findOne({ _id: hotelId, vendorId });
  if (!hotel) {
    throw new ApiError(404, "Hotel listing not found");
  }

  const allowed = [
    "title", "description", "location", "city", "state", "propertyType",
    "image", "gallery", "pricePerNight", "bedrooms", "bathrooms", "maxGuests",
    "amenities", "checkInTime", "checkOutTime", "latitude", "longitude",
  ];

  allowed.forEach((key) => {
    if (data[key] !== undefined) hotel[key] = data[key];
  });

  hotel.status = "pending";
  await hotel.save();
  return hotel;
};

const deleteHotel = async (vendorId, hotelId) => {
  const hotel = await Hotel.findOneAndDelete({ _id: hotelId, vendorId });
  if (!hotel) {
    throw new ApiError(404, "Hotel listing not found");
  }
  return hotel;
};

const getVendorHotels = async (vendorId) => {
  return Hotel.find({ vendorId }).sort({ createdAt: -1 }).lean();
};

module.exports = {
  getHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel,
  getVendorHotels,
};