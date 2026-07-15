const axios = require("axios");

const TICKETMASTER_EVENTS_URL =
  "https://app.ticketmaster.com/discovery/v2/events.json";


const demoEvents = [
  {
    id: "demo-event-1",
    title: "VizTravel Music Night",
    description:
      "An open-air live music evening with local artists, food stalls, and travel community meetups.",
    date: "2026-05-12",
    time: "19:00:00",
    image:
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4",
    location: "City Convention Arena",
    city: "New Delhi",
  },
  {
    id: "demo-event-2",
    title: "Weekend Food & Culture Festival",
    description:
      "A curated cultural festival featuring regional food, folk performances, handicrafts, and family activities.",
    date: "2026-05-18",
    time: "16:30:00",
    image:
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3",
    location: "Central Exhibition Ground",
    city: "Gurugram",
  },
  {
    id: "demo-event-3",
    title: "Adventure Travel Expo",
    description:
      "Meet adventure tour operators, discover trekking routes, attend safety workshops, and explore new travel gear.",
    date: "2026-05-24",
    time: "11:00:00",
    image:
      "https://images.unsplash.com/photo-1527631746610-bca00a040d60",
    location: "Travel Hub Expo Centre",
    city: "Noida",
  },
];
  

const DEFAULT_EVENT_IMAGE =
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80&auto=format";

const pickImage = (images = []) => {
  if (!Array.isArray(images) || images.length === 0) return DEFAULT_EVENT_IMAGE;

  const sortedImages = [...images].sort((a, b) => {
    const aPixels = Number(a.width || 0) * Number(a.height || 0);
    const bPixels = Number(b.width || 0) * Number(b.height || 0);
    return bPixels - aPixels;
  });

  return sortedImages[0]?.url || DEFAULT_EVENT_IMAGE;
};

const mapTicketmasterEvent = (event) => {
  const venue = event?._embedded?.venues?.[0] || {};

  return {
    id: event?.id || "",
    title: event?.name || "Untitled event",
    description: event?.info || event?.pleaseNote || "No description",
    date: event?.dates?.start?.localDate || "",
    time: event?.dates?.start?.localTime || "",
    image: pickImage(event?.images),
    location: venue?.name || "Venue not available",
    city: venue?.city?.name || "",
  };
};

exports.getEvents = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    // Fast path: no GPS / no Ticketmaster key → instant demo list
    if (!lat || !lng || !process.env.TICKETMASTER_API_KEY) {
      return res.json(demoEvents);
    }

    const response = await axios.get(TICKETMASTER_EVENTS_URL, {
      params: {
        apikey: process.env.TICKETMASTER_API_KEY,
        latlong: `${lat},${lng}`,
        radius: 50,
        unit: "km",
        size: 20,
      },
      timeout: 6000,
    });

    const events = response.data?._embedded?.events || [];

    // return res.json(events.map(mapTicketmasterEvent));
     const mappedEvents = events.map(mapTicketmasterEvent);

    return res.json(mappedEvents.length ? mappedEvents : demoEvents);
  } catch (error) {
    // return res.json([]);
      return res.json(demoEvents);
  }
};