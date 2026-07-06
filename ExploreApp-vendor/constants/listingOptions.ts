export const TOUR_CATEGORIES = [
  "Beach",
  "Mountain",
  "City",
  "Adventure",
  "Cultural",
  "Wildlife",
  "Other",
] as const;

export const PROPERTY_TYPES = [
  { value: "hotel", label: "Hotel" },
  { value: "resort", label: "Resort" },
  { value: "villa", label: "Villa" },
  { value: "apartment", label: "Apartment" },
  { value: "homestay", label: "Homestay" },
  { value: "hostel", label: "Hostel" },
] as const;

export const TOUR_AMENITIES = [
  "Guide",
  "Meals",
  "Transport",
  "Accommodation",
  "Insurance",
  "Equipment",
  "Photography",
  "Tickets",
  "Pickup & Drop",
  "First Aid",
] as const;

export const HOTEL_AMENITIES = [
  "WiFi",
  "Parking",
  "Pool",
  "AC",
  "Breakfast",
  "Kitchen",
  "Pet Friendly",
  "Gym",
  "Spa",
  "Restaurant",
  "Room Service",
  "Laundry",
  "24/7 Reception",
  "Airport Shuttle",
] as const;

export const MAX_GALLERY_IMAGES = 8;