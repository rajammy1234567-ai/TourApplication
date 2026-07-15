const mongoose = require("mongoose");
const Tour = require("../models/Tour");
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

const withCoverImage = (tour) => {
  if (!tour) return tour;
  const gallery = Array.isArray(tour.gallery) ? tour.gallery.filter(Boolean) : [];
  return {
    ...tour,
    image: tour.image || gallery[0] || undefined,
    gallery,
  };
};

const getTourFilter = (tourId) => {
  if (!tourId) {
    throw new ApiError(400, "tourId is required");
  }

  const filters = [{ packageId: String(tourId) }];
  if (mongoose.Types.ObjectId.isValid(tourId)) {
    filters.push({ _id: tourId });
  }

  return { $or: filters };
};

const getTours = async ({ search, page = 1, limit = 50 } = {}) => {
  const and = [publicVisibilityFilter()];

  if (search && String(search).trim()) {
    const re = new RegExp(escapeRegex(String(search).trim()), "i");
    and.push({
      $or: [
        { title: re },
        { location: re },
        { description: re },
        { category: re },
        { packageId: re },
      ],
    });
  }

  const filter = and.length === 1 ? and[0] : { $and: and };
  const skip = (Math.max(1, page) - 1) * limit;

  const tours = await Tour.find(filter)
    .select(
      "title packageId image location duration people rating price category gallery description amenities status vendorId createdAt"
    )
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return tours.map(withCoverImage);
};

const getTourById = async (tourId) => {
  const tour = await Tour.findOne({
    $and: [getTourFilter(tourId), publicVisibilityFilter()],
  })
    .populate("vendorId", "businessName ownerName phone email city state address businessType")
    .lean();

  if (!tour) {
    throw new ApiError(404, "Tour package not found");
  }

  return withCoverImage(tour);
};

module.exports = { getTours, getTourById, publicVisibilityFilter };
