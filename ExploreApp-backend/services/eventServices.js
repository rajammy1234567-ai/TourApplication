import axios from "axios";
import Event from "../models/Event.js";

export const fetchEventsFromAPI = async () => {
  try {
    // Example: Ticketmaster API
    const res = await axios.get(
      `https://app.ticketmaster.com/discovery/v2/events.json`,
      {
        params: {
          apikey: process.env.TICKETMASTER_API_KEY,
          countryCode: "IN"
        }
      }
    );

    const events = res.data._embedded?.events || [];

    for (let e of events) {
      const exists = await Event.findOne({ externalId: e.id });

      if (!exists) {
        await Event.create({
          title: e.name,
          description: e.info || "No description",
          category: e.classifications?.[0]?.segment?.name || "event",

          location: {
            city: e._embedded?.venues?.[0]?.city?.name,
            state: e._embedded?.venues?.[0]?.state?.name,
            coordinates: [
              parseFloat(e._embedded?.venues?.[0]?.location?.longitude || 0),
              parseFloat(e._embedded?.venues?.[0]?.location?.latitude || 0)
            ]
          },

          venue: e._embedded?.venues?.[0]?.name,
          startDate: e.dates?.start?.dateTime,
          image: e.images?.[0]?.url,

          source: "api",
          externalId: e.id,
          externalLink: e.url
        });
      }
    }

    console.log("API Events Synced");
  } catch (err) {
    console.error("API Fetch Error:", err.message);
  }
};