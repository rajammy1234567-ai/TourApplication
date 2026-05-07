const axios = require("axios");
const Event = require("../models/Events");

const fetchEventsFromAPI = async () => {
  try {
    const res = await axios.get("https://app.ticketmaster.com/discovery/v2/events.json", {
      params: {
        apikey: process.env.TICKETMASTER_API_KEY,
        countryCode: "IN",
      },
      timeout: 10000,
    });

    const events = res.data?._embedded?.events || [];

    for (const event of events) {
      const exists = await Event.findOne({ externalId: event.id });

      if (!exists) {
        await Event.create({
          title: event.name,
          description: event.info || "No description",
          category: event.classifications?.[0]?.segment?.name || "event",
          location: {
            city: event._embedded?.venues?.[0]?.city?.name,
            state: event._embedded?.venues?.[0]?.state?.name,
            coordinates: [
              parseFloat(event._embedded?.venues?.[0]?.location?.longitude || 0),
              parseFloat(event._embedded?.venues?.[0]?.location?.latitude || 0),
            ],
          },
          venue: event._embedded?.venues?.[0]?.name,
          startDate: event.dates?.start?.dateTime,
          image: event.images?.[0]?.url,
          source: "api",
          externalId: event.id,
          externalLink: event.url,
        });
      }
    }

    console.log("API Events Synced");
  } catch (err) {
    console.error("API Fetch Error:", err.message);
  }
};

module.exports = { fetchEventsFromAPI };