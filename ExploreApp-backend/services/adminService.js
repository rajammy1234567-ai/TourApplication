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
    .populate("userId", "fullname email phone")
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
  await application.save();

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

  return application;
};

const getAllUsers = async () => {
  return User.find().select("-password -otp").sort({ createdAt: -1 }).lean();
};

const getAllVendors = async () => {
  return Vendor.find().select("-password").sort({ createdAt: -1 }).lean();
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
  return Tour.find().sort({ createdAt: -1 }).lean();
};

const getAllHotels = async () => {
  return Hotel.find().sort({ createdAt: -1 }).lean();
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
  toggleVendorStatus,
  resetVendorPassword,
  updateListingStatus,
  getAllBookings,
  getAllTours,
  getAllHotels,
  deleteUser,
  toSafeAdmin,
};