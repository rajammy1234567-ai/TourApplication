import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,

  location: {
    city: String,
    state: String,
    coordinates: {
      type: [Number], 
      index: "2dsphere"
    }
  },

  venue: String,
  startDate: Date,
  endDate: Date,
  price: Number,
  image: String,

  source: {
    type: String,
    enum: ["api", "manual"],
    default: "manual"
  },

  externalId: String,
  organizer: String,
  externalLink: String

}, { timestamps: true });

export default mongoose.model("Event", eventSchema);