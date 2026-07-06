const bcrypt = require("bcryptjs");
const Vendor = require("../models/Vendor");
const VendorApplication = require("../models/VendorApplication");
const Tour = require("../models/Tour");
const Hotel = require("../models/Hotel");
const Booking = require("../models/Booking");
const HotelBooking = require("../models/HotelBooking");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { signVendorToken } = require("../utils/tokens");
const { createUserNotification } = require("./notificationService");

const formatDate = (d) => (d ? new Date(d).toISOString() : null);

const mapTourBooking = (b) => ({
  _id: b._id,
  type: "tour",
  customerName: b.userId?.fullname || b.userId?.name || "Guest",
  customerPhone: b.userId?.phone || "",
  customerEmail: b.userId?.email || "",
  listingTitle: b.tourId?.title || b.packageName,
  listingLocation: b.tourId?.location || "",
  tourId: b.tourId?._id || b.tourId,
  startDate: formatDate(b.startDate),
  endDate: formatDate(b.endDate),
  travelers: b.travelers,
  children: b.children,
  room: b.room || null,
  totalAmount: b.totalAmount,
  paidAmount: b.paidAmount,
  remainingAmount: b.remainingAmount,
  paymentStatus: b.paymentStatus,
  bookingStatus: b.bookingStatus,
  bookedAt: formatDate(b.createdAt),
});

const mapHotelBooking = (b) => ({
  _id: b._id,
  type: "hotel",
  customerName: b.guestName || b.userId?.fullname || "Guest",
  customerPhone: b.guestPhone || b.userId?.phone || "",
  customerEmail: b.guestEmail || b.userId?.email || "",
  listingTitle: b.hotelId?.title || "Stay",
  listingLocation: b.hotelId?.city || b.hotelId?.location || "",
  hotelId: b.hotelId?._id || b.hotelId,
  checkIn: formatDate(b.checkIn),
  checkOut: formatDate(b.checkOut),
  rooms: b.rooms,
  guests: b.guests,
  roomType: b.roomType,
  totalAmount: b.totalAmount,
  paidAmount: b.paidAmount,
  paymentStatus: b.paymentStatus,
  bookingStatus: b.bookingStatus,
  bookedAt: formatDate(b.createdAt),
});

const getVendorListingIds = async (vendorId) => {
  const [tourIds, hotelIds] = await Promise.all([
    Tour.find({ vendorId }).distinct("_id"),
    Hotel.find({ vendorId }).distinct("_id"),
  ]);
  return { tourIds, hotelIds };
};

const ensureDefaultVendor = async () => {
  const phone = process.env.VENDOR_PHONE || "9876543210";
  const password = process.env.VENDOR_PASSWORD || "vendor123";

  const existing = await Vendor.findOne({ phone });
  if (existing) return;

  const hashed = await bcrypt.hash(password, 10);

  await Vendor.create({
    businessName: "Demo Travel Co.",
    ownerName: "Demo Vendor",
    phone,
    email: "vendor@explore.com",
    address: "123 Demo Street",
    city: "Mumbai",
    state: "Maharashtra",
    businessType: "both",
    password: hashed,
    isActive: true,
  });

  console.log(`Default vendor created — phone: ${phone}, password: ${password}`);
  await seedDemoVendorData();
};

const seedDemoVendorData = async () => {
  const phone = process.env.VENDOR_PHONE || "9876543210";
  const vendor = await Vendor.findOne({ phone });
  if (!vendor) return;

  const { tourIds, hotelIds } = await getVendorListingIds(vendor._id);
  const hasTourBookings = tourIds.length
    ? await Booking.countDocuments({ tourId: { $in: tourIds } })
    : 0;
  const hasHotelBookings = hotelIds.length
    ? await HotelBooking.countDocuments({ hotelId: { $in: hotelIds } })
    : 0;

  if (hasTourBookings > 0 || hasHotelBookings > 0) return;

  const customers = await Promise.all([
    User.findOneAndUpdate(
      { email: "rahul.sharma@demo.com" },
      { fullname: "Rahul Sharma", phone: "9988776655" },
      { upsert: true, new: true }
    ),
    User.findOneAndUpdate(
      { email: "priya.patel@demo.com" },
      { fullname: "Priya Patel", phone: "9876512340" },
      { upsert: true, new: true }
    ),
    User.findOneAndUpdate(
      { email: "amit.singh@demo.com" },
      { fullname: "Amit Singh", phone: "9123456780" },
      { upsert: true, new: true }
    ),
  ]);

  const tourSeeds = [
    {
      title: "Goa Beach Escape",
      location: "Goa",
      duration: "4 Days / 3 Nights",
      people: "2-6",
      price: 12500,
      category: "Beach",
      packageId: "PKG-GOA-001",
      image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80&auto=format",
    },
    {
      title: "Manali Snow Trek",
      location: "Manali",
      duration: "5 Days / 4 Nights",
      people: "4-10",
      price: 18900,
      category: "Mountain",
      packageId: "PKG-MAN-002",
      image: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800&q=80&auto=format",
    },
  ];

  const hotelSeeds = [
    {
      title: "Seaside Villa Resort",
      city: "Goa",
      location: "Calangute Beach Road",
      pricePerNight: 4500,
      bedrooms: 2,
      bathrooms: 2,
      maxGuests: 4,
      propertyType: "resort",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80&auto=format",
    },
    {
      title: "Hilltop Homestay",
      city: "Manali",
      location: "Old Manali",
      pricePerNight: 3200,
      bedrooms: 1,
      bathrooms: 1,
      maxGuests: 3,
      propertyType: "homestay",
      image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80&auto=format",
    },
  ];

  const tourDocs = [];
  for (const seed of tourSeeds) {
    let tour = await Tour.findOne({ vendorId: vendor._id, title: seed.title });
    if (!tour) {
      tour = await Tour.create({
        vendorId: vendor._id,
        status: "approved",
        ...seed,
      });
    } else if (!tour.image) {
      tour.image = seed.image;
      await tour.save();
    }
    tourDocs.push(tour);
  }

  const [tour1, tour2] = tourDocs;

  const hotelDocs = [];
  for (const seed of hotelSeeds) {
    let hotel = await Hotel.findOne({ vendorId: vendor._id, title: seed.title });
    if (!hotel) {
      hotel = await Hotel.create({
        vendorId: vendor._id,
        status: "approved",
        ...seed,
      });
    } else if (!hotel.image) {
      hotel.image = seed.image;
      await hotel.save();
    }
    hotelDocs.push(hotel);
  }

  const [hotel1, hotel2] = hotelDocs;

  const now = new Date();
  const daysAgo = (n) => new Date(now.getTime() - n * 86400000);
  const daysAhead = (n) => new Date(now.getTime() + n * 86400000);

  await Booking.insertMany([
    {
      userId: customers[0]._id,
      tourId: tour1._id,
      packageIdSnapshot: tour1.packageId,
      packageName: tour1.title,
      startDate: daysAhead(12),
      endDate: daysAhead(16),
      travelers: 2,
      children: 1,
      meal: true,
      room: "Deluxe",
      totalAmount: 42500,
      paidAmount: 4250,
      remainingAmount: 38250,
      paymentStatus: "Paid",
      bookingStatus: "Confirmed",
      razorpayOrderId: `demo_order_tour_${Date.now()}_1`,
      razorpayPaymentId: `demo_pay_tour_${Date.now()}_1`,
      razorpaySignature: "demo_sig_1",
      createdAt: daysAgo(2),
    },
    {
      userId: customers[1]._id,
      tourId: tour2._id,
      packageIdSnapshot: tour2.packageId,
      packageName: tour2.title,
      startDate: daysAhead(25),
      endDate: daysAhead(30),
      travelers: 4,
      children: 0,
      meal: false,
      totalAmount: 75600,
      paidAmount: 7560,
      remainingAmount: 68040,
      paymentStatus: "Paid",
      bookingStatus: "Confirmed",
      razorpayOrderId: `demo_order_tour_${Date.now()}_2`,
      razorpayPaymentId: `demo_pay_tour_${Date.now()}_2`,
      razorpaySignature: "demo_sig_2",
      createdAt: daysAgo(5),
    },
    {
      userId: customers[2]._id,
      tourId: tour1._id,
      packageIdSnapshot: tour1.packageId,
      packageName: tour1.title,
      startDate: daysAgo(20),
      endDate: daysAgo(16),
      travelers: 2,
      children: 0,
      totalAmount: 26875,
      paidAmount: 2687.5,
      remainingAmount: 24187.5,
      paymentStatus: "Paid",
      bookingStatus: "Confirmed",
      razorpayOrderId: `demo_order_tour_${Date.now()}_3`,
      razorpayPaymentId: `demo_pay_tour_${Date.now()}_3`,
      razorpaySignature: "demo_sig_3",
      createdAt: daysAgo(30),
    },
  ]);

  await HotelBooking.insertMany([
    {
      userId: customers[0]._id,
      hotelId: hotel1._id,
      guestName: "Rahul Sharma",
      guestPhone: "9988776655",
      guestEmail: "rahul.sharma@demo.com",
      checkIn: daysAhead(7),
      checkOut: daysAhead(10),
      rooms: 2,
      guests: 4,
      roomType: "Sea View Deluxe",
      totalAmount: 13500,
      paidAmount: 13500,
      bookingStatus: "Confirmed",
      paymentStatus: "Paid",
      createdAt: daysAgo(1),
    },
    {
      userId: customers[1]._id,
      hotelId: hotel2._id,
      guestName: "Priya Patel",
      guestPhone: "9876512340",
      guestEmail: "priya.patel@demo.com",
      checkIn: daysAhead(14),
      checkOut: daysAhead(17),
      rooms: 1,
      guests: 2,
      roomType: "Mountain View",
      totalAmount: 9600,
      paidAmount: 9600,
      bookingStatus: "Confirmed",
      paymentStatus: "Paid",
      createdAt: daysAgo(3),
    },
    {
      userId: customers[2]._id,
      hotelId: hotel1._id,
      guestName: "Amit Singh",
      guestPhone: "9123456780",
      guestEmail: "amit.singh@demo.com",
      checkIn: daysAgo(10),
      checkOut: daysAgo(7),
      rooms: 1,
      guests: 2,
      roomType: "Standard",
      totalAmount: 13500,
      paidAmount: 13500,
      bookingStatus: "Completed",
      paymentStatus: "Paid",
      createdAt: daysAgo(15),
    },
  ]);

  console.log("Demo vendor listings & bookings seeded");
};

const toSafeVendor = (vendor) => ({
  _id: vendor._id,
  businessName: vendor.businessName,
  ownerName: vendor.ownerName,
  phone: vendor.phone,
  email: vendor.email,
  address: vendor.address,
  city: vendor.city,
  state: vendor.state,
  businessType: vendor.businessType,
  isActive: vendor.isActive,
});

const submitApplication = async (userId, data) => {
  const { businessName, ownerName, phone, email, address, city, state, businessType, gstNumber, description } = data;

  if (!businessName || !ownerName || !phone) {
    throw new ApiError(400, "Business name, owner name and phone are required");
  }

  const existingVendor = await Vendor.findOne({ phone });
  if (existingVendor) {
    throw new ApiError(400, "A vendor account already exists with this phone number");
  }

  const pendingApp = await VendorApplication.findOne({ userId, status: "pending" });
  if (pendingApp) {
    throw new ApiError(400, "You already have a pending vendor application");
  }

  const approvedApp = await VendorApplication.findOne({ userId, status: "approved" });
  if (approvedApp) {
    throw new ApiError(400, "You are already an approved vendor");
  }

  const application = await VendorApplication.create({
    userId,
    businessName,
    ownerName,
    phone,
    email,
    address,
    city,
    state,
    businessType: businessType || "both",
    gstNumber,
    description,
  });

  await createUserNotification({
    userId,
    type: "vendor_submitted",
    title: "Application submitted",
    body: `Your partner application for "${businessName}" was sent to admin. We'll notify you when it's reviewed.`,
    link: "/becomeVendor",
    meta: { applicationId: application._id },
  });

  return application;
};

const getMyApplication = async (userId) => {
  const application = await VendorApplication.findOne({ userId })
    .sort({ createdAt: -1 })
    .select("+vendorLoginPassword")
    .lean();

  if (!application) return null;

  if (application.status !== "approved") {
    delete application.vendorLoginPassword;
  }

  return application;
};

const vendorLogin = async (phone, password) => {
  if (!phone || !password) {
    throw new ApiError(400, "Phone and password are required");
  }

  const vendor = await Vendor.findOne({ phone });
  if (!vendor || !vendor.isActive) {
    throw new ApiError(400, "Invalid credentials or inactive account");
  }

  const isMatch = await bcrypt.compare(password, vendor.password);
  if (!isMatch) {
    throw new ApiError(400, "Invalid credentials");
  }

  const token = signVendorToken(vendor._id);
  return { token, vendor: toSafeVendor(vendor) };
};

const createTour = async (vendorId, data) => {
  const { title, location, duration, people, price, image, gallery, description, category, amenities, latitude, longitude } = data;

  if (!title || !price) {
    throw new ApiError(400, "Title and price are required");
  }

  return Tour.create({
    title,
    location,
    duration,
    people,
    price,
    image,
    gallery,
    description,
    category,
    amenities,
    latitude,
    longitude,
    vendorId,
    status: "pending",
  });
};

const updateTour = async (vendorId, tourId, data) => {
  const tour = await Tour.findOne({ _id: tourId, vendorId });
  if (!tour) {
    throw new ApiError(404, "Tour listing not found");
  }

  const allowed = [
    "title", "location", "duration", "people", "price", "image", "gallery",
    "description", "category", "amenities", "latitude", "longitude",
  ];

  allowed.forEach((key) => {
    if (data[key] !== undefined) tour[key] = data[key];
  });

  tour.status = "pending";
  await tour.save();
  return tour;
};

const deleteTour = async (vendorId, tourId) => {
  const tour = await Tour.findOneAndDelete({ _id: tourId, vendorId });
  if (!tour) {
    throw new ApiError(404, "Tour listing not found");
  }
  return tour;
};

const getVendorTours = async (vendorId) => {
  return Tour.find({ vendorId }).sort({ createdAt: -1 }).lean();
};

const getVendorTourBookings = async (vendorId) => {
  const { tourIds } = await getVendorListingIds(vendorId);
  if (!tourIds.length) return [];

  const bookings = await Booking.find({ tourId: { $in: tourIds } })
    .populate("userId", "fullname name email phone")
    .populate("tourId", "title location duration")
    .sort({ createdAt: -1 })
    .lean();

  return bookings.map(mapTourBooking);
};

const getVendorHotelBookings = async (vendorId) => {
  const { hotelIds } = await getVendorListingIds(vendorId);
  if (!hotelIds.length) return [];

  const bookings = await HotelBooking.find({ hotelId: { $in: hotelIds } })
    .populate("userId", "fullname name email phone")
    .populate("hotelId", "title city location propertyType")
    .sort({ createdAt: -1 })
    .lean();

  return bookings.map(mapHotelBooking);
};

const getVendorBookings = async (vendorId) => {
  const [tourBookings, hotelBookings] = await Promise.all([
    getVendorTourBookings(vendorId),
    getVendorHotelBookings(vendorId),
  ]);

  const all = [...tourBookings, ...hotelBookings].sort(
    (a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime()
  );

  const now = new Date();
  const upcoming = all.filter((b) => {
    const tripDate = b.type === "tour" ? b.startDate : b.checkIn;
    return tripDate && new Date(tripDate) >= now && b.bookingStatus !== "Cancelled";
  });
  const completed = all.filter((b) => b.bookingStatus === "Completed");
  const past = all.filter((b) => {
    const tripDate = b.type === "tour" ? b.endDate : b.checkOut;
    return tripDate && new Date(tripDate) < now;
  });

  return { all, upcoming, past, completed, tourBookings, hotelBookings };
};

const getVendorActivity = async (vendorId) => {
  const { all: bookings } = await getVendorBookings(vendorId);
  const [recentTours, recentHotels] = await Promise.all([
    Tour.find({ vendorId }).sort({ createdAt: -1 }).limit(3).lean(),
    Hotel.find({ vendorId }).sort({ createdAt: -1 }).limit(3).lean(),
  ]);

  const bookingActivity = bookings.slice(0, 15).map((b) => ({
    id: `${b.type}_${b._id}`,
    type: b.type === "tour" ? "tour_booking" : "hotel_booking",
    title:
      b.type === "tour"
        ? `${b.customerName} booked ${b.listingTitle}`
        : `${b.customerName} booked ${b.rooms} room(s) at ${b.listingTitle}`,
    subtitle:
      b.type === "tour"
        ? `${b.travelers} travelers · ${b.startDate ? new Date(b.startDate).toLocaleDateString("en-IN") : "—"}`
        : `${b.roomType || "Room"} · ${b.checkIn ? new Date(b.checkIn).toLocaleDateString("en-IN") : "—"} to ${b.checkOut ? new Date(b.checkOut).toLocaleDateString("en-IN") : "—"}`,
    amount: b.paidAmount,
    status: b.bookingStatus,
    timestamp: b.bookedAt,
    icon: b.type === "tour" ? "airplane" : "bed",
  }));

  const listingActivity = [
    ...recentTours.map((t) => ({
      id: `tour_list_${t._id}`,
      type: "listing",
      title: `Tour: ${t.title}`,
      subtitle: `${t.location || "—"} · ${t.status}`,
      amount: t.price,
      status: t.status,
      timestamp: t.createdAt,
      icon: "map",
    })),
    ...recentHotels.map((h) => ({
      id: `hotel_list_${h._id}`,
      type: "listing",
      title: `Stay: ${h.title}`,
      subtitle: `${h.city || "—"} · ${h.status}`,
      amount: h.pricePerNight,
      status: h.status,
      timestamp: h.createdAt,
      icon: "home",
    })),
  ];

  return [...bookingActivity, ...listingActivity]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);
};

const getVendorDashboard = async (vendorId) => {
  const now = new Date();

  const [
    tours,
    hotels,
    tourCount,
    hotelCount,
    pendingTours,
    pendingHotels,
    approvedTours,
    approvedHotels,
    bookingsData,
    activity,
  ] = await Promise.all([
    Tour.find({ vendorId }).sort({ createdAt: -1 }).limit(5).lean(),
    Hotel.find({ vendorId }).sort({ createdAt: -1 }).limit(5).lean(),
    Tour.countDocuments({ vendorId }),
    Hotel.countDocuments({ vendorId }),
    Tour.countDocuments({ vendorId, status: "pending" }),
    Hotel.countDocuments({ vendorId, status: "pending" }),
    Tour.countDocuments({ vendorId, status: "approved" }),
    Hotel.countDocuments({ vendorId, status: "approved" }),
    getVendorBookings(vendorId),
    getVendorActivity(vendorId),
  ]);

  const tourRevenue = bookingsData.tourBookings.reduce((s, b) => s + (b.paidAmount || 0), 0);
  const hotelRevenue = bookingsData.hotelBookings.reduce((s, b) => s + (b.paidAmount || 0), 0);
  const totalTravelers = bookingsData.tourBookings.reduce(
    (s, b) => s + (b.travelers || 0) + (b.children || 0),
    0
  );
  const totalRoomNights = bookingsData.hotelBookings.reduce((s, b) => {
    if (!b.checkIn || !b.checkOut) return s;
    const nights = Math.max(
      1,
      Math.round((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / 86400000)
    );
    return s + nights * (b.rooms || 1);
  }, 0);

  return {
    stats: {
      totalTours: tourCount,
      totalHotels: hotelCount,
      approvedTours,
      approvedHotels,
      pendingTours,
      pendingHotels,
      totalBookings: bookingsData.all.length,
      upcomingBookings: bookingsData.upcoming.length,
      completedBookings: bookingsData.completed.length,
      tourBookings: bookingsData.tourBookings.length,
      hotelBookings: bookingsData.hotelBookings.length,
      totalTravelers,
      totalRoomNights,
      tourRevenue,
      hotelRevenue,
      totalRevenue: tourRevenue + hotelRevenue,
    },
    recentBookings: bookingsData.all.slice(0, 8),
    upcomingBookings: bookingsData.upcoming.slice(0, 5),
    activity,
    recentTours: tours,
    recentHotels: hotels,
    generatedAt: now.toISOString(),
  };
};

module.exports = {
  ensureDefaultVendor,
  seedDemoVendorData,
  submitApplication,
  getMyApplication,
  vendorLogin,
  createTour,
  updateTour,
  deleteTour,
  getVendorTours,
  getVendorDashboard,
  getVendorBookings,
  getVendorActivity,
  toSafeVendor,
};