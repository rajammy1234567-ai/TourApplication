const mongoose = require("mongoose");
const Tour = require("../models/Tour");
const ApiError = require("../utils/ApiError");

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

const getTours = async ({ search } = {}) => {
  const filter = search
    ? { $text: { $search: String(search) } }
    : {};

  return Tour.find(filter).sort({ createdAt: -1 }).lean();
};

const getTourById = async (tourId) => {
  const tour = await Tour.findOne(getTourFilter(tourId)).lean();
  if (!tour) {
    throw new ApiError(404, "Tour package not found");
  }

  return tour;
};

module.exports = { getTours, getTourById };