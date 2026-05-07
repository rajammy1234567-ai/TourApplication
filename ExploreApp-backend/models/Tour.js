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
      unique: true,
      sparse: true,
    },
    image: String,
    location: {
      type: String,
      trim: true,
      index: true,
    },
    duration: String,
    people: String,
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);


tourSchema.index({ title: "text", location: "text" });

module.exports = mongoose.model("Tour", tourSchema);