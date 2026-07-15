const Hotel = require("../models/Hotel");
const ApiError = require("../utils/ApiError");

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Live on user app: approved, or legacy rows created before status existed. */
const publicVisibilityFilter = () => ({
  $or: [
    { status: "approved" },
    { status: { $exists: false } },
    { status: null },
    { status: "" },
  ],
});

const withCoverImage = (hotel, { list = false } = {}) => {
  if (!hotel) return hotel;
  const gallery = Array.isArray(hotel.gallery) ? hotel.gallery.filter(Boolean) : [];
  const image = hotel.image || gallery[0] || undefined;
  if (list) {
    return {
      _id: hotel._id,
      title: hotel.title,
      image,
      location: hotel.location,
      city: hotel.city,
      state: hotel.state,
      propertyType: hotel.propertyType,
      pricePerNight: hotel.pricePerNight,
      bedrooms: hotel.bedrooms,
      bathrooms: hotel.bathrooms,
      maxGuests: hotel.maxGuests,
      rating: hotel.rating,
      status: hotel.status,
      createdAt: hotel.createdAt,
    };
  }
  return {
    ...hotel,
    image,
    gallery,
  };
};

const getHotels = async ({ search, city, propertyType, page = 1, limit = 40 } = {}) => {
  const and = [publicVisibilityFilter()];

  if (search && String(search).trim()) {
    const re = new RegExp(escapeRegex(String(search).trim()), "i");
    and.push({
      $or: [
        { title: re },
        { location: re },
        { city: re },
        { state: re },
        { description: re },
        { propertyType: re },
      ],
    });
  }

  if (city && String(city).trim()) {
    and.push({ city: new RegExp(escapeRegex(String(city).trim()), "i") });
  }

  if (propertyType && String(propertyType).trim() && propertyType !== "All") {
    and.push({ propertyType: String(propertyType).trim().toLowerCase() });
  }

  const filter = and.length === 1 ? and[0] : { $and: and };
  const safeLimit = Math.min(limit, 60);
  const skip = (Math.max(1, page) - 1) * safeLimit;

  const hotels = await Hotel.find(filter)
    .select(
      "title image gallery location city state propertyType pricePerNight bedrooms bathrooms maxGuests rating status createdAt"
    )
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(safeLimit)
    .lean();

  return hotels.map((h) => withCoverImage(h, { list: true }));
};

const getHotelById = async (hotelId) => {
  const hotel = await Hotel.findOne({
    $and: [{ _id: hotelId }, publicVisibilityFilter()],
  })
    .populate("vendorId", "businessName ownerName phone email city state address businessType")
    .lean();

  if (!hotel) {
    throw new ApiError(404, "Hotel not found");
  }
  return withCoverImage(hotel);
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

const getVendorHotelById = async (vendorId, hotelId) => {
  const hotel = await Hotel.findOne({ _id: hotelId, vendorId }).lean();
  if (!hotel) {
    throw new ApiError(404, "Hotel listing not found");
  }
  return hotel;
};

module.exports = {
  getHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel,
  getVendorHotels,
  getVendorHotelById,
  publicVisibilityFilter,
};
