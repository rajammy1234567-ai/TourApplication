const mongoose = require("mongoose");

const tourSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    packageId: {
      type: String,
      trim: true,
      index: true,
    },
    image: String,
    location: String,
    duration: String,
    people: String,
    rating: Number,
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tour", tourSchema);