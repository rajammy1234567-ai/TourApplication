const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");
const User = require("../models/User");
const Vendor = require("../models/Vendor");
const VendorApplication = require("../models/VendorApplication");
const Tour = require("../models/Tour");
const Hotel = require("../models/Hotel");
const Booking = require("../models/Booking");
const HotelBooking = require("../models/HotelBooking");
const Event = require("../models/Events");
const ApiError = require("../utils/ApiError");
const { signAdminToken } = require("../utils/tokens");
const { createUserNotification } = require("./notificationService");
const vendorService = require("./vendorService");

const buildVendorStats = (tours = [], hotels = [], bookings = { tourBookings: [], hotelBookings: [], all: [], upcoming: [], completed: [] }) => {
  const tourRevenue = bookings.tourBookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
  const hotelRevenue = bookings.hotelBookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0);

  return {
    tours: tours.length,
    toursApproved: tours.filter((item) => item.status === "approved").length,
    toursPending: tours.filter((item) => item.status === "pending").length,
    toursRejected: tours.filter((item) => item.status === "rejected").length,
    hotels: hotels.length,
    hotelsApproved: hotels.filter((item) => item.status === "approved").length,
    hotelsPending: hotels.filter((item) => item.status === "pending").length,
    hotelsRejected: hotels.filter((item) => item.status === "rejected").length,
    tourBookings: bookings.tourBookings.length,
    hotelBookings: bookings.hotelBookings.length,
    totalBookings: bookings.all.length,
    upcomingBookings: bookings.upcoming.length,
    completedBookings: bookings.completed.length,
    tourRevenue,
    hotelRevenue,
    totalRevenue: tourRevenue + hotelRevenue,
  };
};

const attachVendorStats = async (vendors) => {
  if (!vendors.length) return [];

  const vendorIds = vendors.map((vendor) => vendor._id);

  const [tourAgg, hotelAgg, vendorTours, vendorHotels] = await Promise.all([
    Tour.aggregate([
      { $match: { vendorId: { $in: vendorIds } } },
      {
        $group: {
          _id: "$vendorId",
          total: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
        },
      },
    ]),
    Hotel.aggregate([
      { $match: { vendorId: { $in: vendorIds } } },
      {
        $group: {
          _id: "$vendorId",
          total: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
        },
      },
    ]),
    Tour.find({ vendorId: { $in: vendorIds } }).select("_id vendorId").lean(),
    Hotel.find({ vendorId: { $in: vendorIds } }).select("_id vendorId").lean(),
  ]);

  const tourMap = Object.fromEntries(tourAgg.map((row) => [String(row._id), row]));
  const hotelMap = Object.fromEntries(hotelAgg.map((row) => [String(row._id), row]));
  const tourIdToVendor = Object.fromEntries(vendorTours.map((tour) => [String(tour._id), String(tour.vendorId)]));
  const hotelIdToVendor = Object.fromEntries(vendorHotels.map((hotel) => [String(hotel._id), String(hotel.vendorId)]));

  const bookingStatsByVendor = Object.fromEntries(
    vendorIds.map((id) => [
      String(id),
      { tourBookings: 0, hotelBookings: 0, totalRevenue: 0 },
    ])
  );

  const [tourBookings, hotelBookings] = await Promise.all([
    vendorTours.length
      ? Booking.find({ tourId: { $in: vendorTours.map((tour) => tour._id) } })
          .select("tourId paidAmount")
          .lean()
      : [],
    vendorHotels.length
      ? HotelBooking.find({ hotelId: { $in: vendorHotels.map((hotel) => hotel._id) } })
          .select("hotelId paidAmount")
          .lean()
      : [],
  ]);

  tourBookings.forEach((booking) => {
    const vendorKey = tourIdToVendor[String(booking.tourId)];
    if (!vendorKey || !bookingStatsByVendor[vendorKey]) return;
    bookingStatsByVendor[vendorKey].tourBookings += 1;
    bookingStatsByVendor[vendorKey].totalRevenue += booking.paidAmount || 0;
  });

  hotelBookings.forEach((booking) => {
    const vendorKey = hotelIdToVendor[String(booking.hotelId)];
    if (!vendorKey || !bookingStatsByVendor[vendorKey]) return;
    bookingStatsByVendor[vendorKey].hotelBookings += 1;
    bookingStatsByVendor[vendorKey].totalRevenue += booking.paidAmount || 0;
  });

  return vendors.map((vendor) => {
    const vendorKey = String(vendor._id);
    const tourStats = tourMap[vendorKey] || { total: 0, approved: 0, pending: 0 };
    const hotelStats = hotelMap[vendorKey] || { total: 0, approved: 0, pending: 0 };
    const bookingStats = bookingStatsByVendor[vendorKey] || {
      tourBookings: 0,
      hotelBookings: 0,
      totalRevenue: 0,
    };

    return {
      ...vendor,
      stats: {
        tours: tourStats.total,
        toursApproved: tourStats.approved,
        toursPending: tourStats.pending,
        hotels: hotelStats.total,
        hotelsApproved: hotelStats.approved,
        hotelsPending: hotelStats.pending,
        tourBookings: bookingStats.tourBookings,
        hotelBookings: bookingStats.hotelBookings,
        totalBookings: bookingStats.tourBookings + bookingStats.hotelBookings,
        totalRevenue: bookingStats.totalRevenue,
      },
    };
  });
};

const toSafeAdmin = (admin) => ({
  _id: admin._id,
  name: admin.name,
  email: admin.email,
  role: admin.role,
});

const ensureDefaultAdmin = async () => {
  const count = await Admin.countDocuments();
  if (count > 0) return;

  const email = process.env.ADMIN_EMAIL || "admin@explore.com";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const hashed = await bcrypt.hash(password, 10);

  await Admin.create({
    name: "Super Admin",
    email,
    password: hashed,
    role: "super_admin",
  });

  console.log(`Default admin created: ${email}`);
};

const adminLogin = async (email, password) => {
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const admin = await Admin.findOne({ email: email.toLowerCase() });
  if (!admin || !admin.isActive) {
    throw new ApiError(400, "Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    throw new ApiError(400, "Invalid credentials");
  }

  const token = signAdminToken(admin._id);
  return { token, admin: toSafeAdmin(admin) };
};

const getDashboardStats = async () => {
  const [
    users, vendors, pendingApplications, tours, hotels,
    pendingTours, pendingHotels, bookings, hotelBookings, events,
  ] = await Promise.all([
    User.countDocuments(),
    Vendor.countDocuments({ isActive: true }),
    VendorApplication.countDocuments({ status: "pending" }),
    Tour.countDocuments(),
    Hotel.countDocuments(),
    Tour.countDocuments({ status: "pending" }),
    Hotel.countDocuments({ status: "pending" }),
    Booking.countDocuments(),
    HotelBooking.countDocuments(),
    Event.countDocuments(),
  ]);

  return {
    users,
    vendors,
    pendingApplications,
    tours,
    hotels,
    pendingTours,
    pendingHotels,
    bookings,
    hotelBookings,
    events,
  };
};

const getVendorApplications = async (status) => {
  const filter = status ? { status } : {};
  return VendorApplication.find(filter)
    .select("+vendorLoginPassword")
    .populate("userId", "fullname email phone")
    .populate("reviewedBy", "name email")
    .sort({ createdAt: -1 })
    .lean();
};

const approveVendorApplication = async (applicationId, adminId, password) => {
  if (!password || password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  const application = await VendorApplication.findById(applicationId);
  if (!application) {
    throw new ApiError(404, "Application not found");
  }
  if (application.status !== "pending") {
    throw new ApiError(400, "Application is already processed");
  }

  const existingVendor = await Vendor.findOne({ phone: application.phone });
  if (existingVendor) {
    throw new ApiError(400, "Vendor with this phone already exists");
  }

  const hashed = await bcrypt.hash(password, 10);

  const vendor = await Vendor.create({
    userId: application.userId,
    businessName: application.businessName,
    ownerName: application.ownerName,
    phone: application.phone,
    email: application.email,
    address: application.address,
    city: application.city,
    state: application.state,
    businessType: application.businessType,
    gstNumber: application.gstNumber,
    password: hashed,
    approvedBy: adminId,
    approvedAt: new Date(),
  });

  application.status = "approved";
  application.reviewedBy = adminId;
  application.reviewedAt = new Date();
  application.vendorLoginPassword = password;
  await application.save();

  await createUserNotification({
    userId: application.userId,
    type: "vendor_approved",
    title: "Partner application approved",
    body: `Your business "${application.businessName}" is approved. Download the Vendor app and login with phone ${application.phone}.`,
    link: "/becomeVendor",
    meta: { applicationId: application._id, phone: application.phone },
  });

  return {
    vendor: {
      _id: vendor._id,
      phone: vendor.phone,
      businessName: vendor.businessName,
      ownerName: vendor.ownerName,
    },
    message: "Vendor approved. Login ID is phone number.",
  };
};

const rejectVendorApplication = async (applicationId, adminId, adminNotes) => {
  const application = await VendorApplication.findById(applicationId);
  if (!application) {
    throw new ApiError(404, "Application not found");
  }
  if (application.status !== "pending") {
    throw new ApiError(400, "Application is already processed");
  }

  application.status = "rejected";
  application.adminNotes = adminNotes || "";
  application.reviewedBy = adminId;
  application.reviewedAt = new Date();
  await application.save();

  await createUserNotification({
    userId: application.userId,
    type: "vendor_rejected",
    title: "Partner application update",
    body: adminNotes
      ? `Your application for "${application.businessName}" was not approved. ${adminNotes}`
      : `Your application for "${application.businessName}" was not approved. You can submit again with updated details.`,
    link: "/becomeVendor",
    meta: { applicationId: application._id },
  });

  return application;
};

const getAllUsers = async () => {
  return User.find().select("-password -otp").sort({ createdAt: -1 }).lean();
};

const getAllVendors = async () => {
  const vendors = await Vendor.find()
    .select("-password")
    .populate("userId", "fullname email phone")
    .sort({ createdAt: -1 })
    .lean();

  return attachVendorStats(vendors);
};

const getVendorDetail = async (vendorId) => {
  const vendor = await Vendor.findById(vendorId)
    .select("-password")
    .populate("userId", "fullname email phone")
    .populate("approvedBy", "name email")
    .lean();

  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  const [application, tours, hotels, bookings] = await Promise.all([
    VendorApplication.findOne({
      userId: vendor.userId,
      status: "approved",
    })
      .select("+vendorLoginPassword")
      .populate("reviewedBy", "name email")
      .sort({ reviewedAt: -1, createdAt: -1 })
      .lean(),
    vendorService.getVendorTours(vendorId),
    Hotel.find({ vendorId }).sort({ createdAt: -1 }).lean(),
    vendorService.getVendorBookings(vendorId),
  ]);

  const stats = buildVendorStats(tours, hotels, bookings);

  return {
    vendor,
    application,
    tours,
    hotels,
    bookings: bookings.all,
    stats,
  };
};

const toggleVendorStatus = async (vendorId, isActive) => {
  const vendor = await Vendor.findByIdAndUpdate(
    vendorId,
    { isActive },
    { new: true }
  ).select("-password");

  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }
  return vendor;
};

const resetVendorPassword = async (vendorId, password) => {
  if (!password || password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  const hashed = await bcrypt.hash(password, 10);
  const vendor = await Vendor.findByIdAndUpdate(
    vendorId,
    { password: hashed },
    { new: true }
  ).select("-password");

  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  await VendorApplication.updateMany(
    { userId: vendor.userId, status: "approved" },
    { vendorLoginPassword: password }
  );

  if (vendor.userId) {
    await createUserNotification({
      userId: vendor.userId,
      type: "vendor_password",
      title: "Vendor password updated",
      body: `Your vendor login password was updated by admin. Open Partner Application to view your new credentials.`,
      link: "/becomeVendor",
      meta: { vendorId: vendor._id },
    });
  }

  return vendor;
};

const updateListingStatus = async (type, listingId, status) => {
  const allowed = ["pending", "approved", "rejected"];
  if (!allowed.includes(status)) {
    throw new ApiError(400, "Status must be pending, approved, or rejected");
  }

  const Model = type === "hotel" ? Hotel : Tour;
  const listing = await Model.findByIdAndUpdate(
    listingId,
    { status },
    { new: true }
  );

  if (!listing) {
    throw new ApiError(404, `${type} listing not found`);
  }

  if (listing.vendorId && ["approved", "rejected"].includes(status)) {
    const vendor = await Vendor.findById(listing.vendorId).select("userId businessName").lean();
    if (vendor?.userId) {
      const label = type === "hotel" ? "stay" : "tour";
      await createUserNotification({
        userId: vendor.userId,
        type: status === "approved" ? "listing_approved" : "listing_rejected",
        title: status === "approved" ? `${label} listing approved` : `${label} listing update`,
        body:
          status === "approved"
            ? `Your ${label} "${listing.title}" is now live on Explore.`
            : `Your ${label} "${listing.title}" was not approved. Contact admin or update and resubmit.`,
        link: "/becomeVendor",
        meta: { listingId: listing._id, listingType: type, status },
      });
    }
  }

  return listing;
};

const getAllBookings = async () => {
  const [tourBookings, hotelBookings] = await Promise.all([
    Booking.find()
      .populate("userId", "fullname email phone")
      .sort({ createdAt: -1 })
      .lean(),
    HotelBooking.find()
      .populate("userId", "fullname email phone")
      .populate("hotelId", "title city location propertyType")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const bookings = [
    ...tourBookings.map((booking) => ({
      ...booking,
      type: "tour",
      listingTitle: booking.packageName,
      startDate: booking.startDate,
      endDate: booking.endDate,
    })),
    ...hotelBookings.map((booking) => ({
      ...booking,
      type: "hotel",
      packageName: booking.hotelId?.title || "Hotel Stay",
      listingTitle: booking.hotelId?.title || "Hotel Stay",
      startDate: booking.checkIn,
      endDate: booking.checkOut,
      remainingAmount: Math.max(0, (booking.totalAmount || 0) - (booking.paidAmount || 0)),
      travelers: booking.guests,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return { bookings, tourBookings, hotelBookings };
};

const getAllTours = async () => {
  return Tour.find()
    .populate("vendorId", "businessName ownerName phone")
    .sort({ createdAt: -1 })
    .lean();
};

const getAllHotels = async () => {
  return Hotel.find()
    .populate("vendorId", "businessName ownerName phone")
    .sort({ createdAt: -1 })
    .lean();
};

const deleteUser = async (userId) => {
  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return user;
};

module.exports = {
  ensureDefaultAdmin,
  adminLogin,
  getDashboardStats,
  getVendorApplications,
  approveVendorApplication,
  rejectVendorApplication,
  getAllUsers,
  getAllVendors,
  getVendorDetail,
  toggleVendorStatus,
  resetVendorPassword,
  updateListingStatus,
  getAllBookings,
  getAllTours,
  getAllHotels,
  deleteUser,
  toSafeAdmin,
};