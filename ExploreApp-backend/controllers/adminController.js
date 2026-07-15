const asyncHandler = require("../utils/asyncHandler");
const adminService = require("../services/adminService");

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await adminService.adminLogin(email, password);
  res.json({
    success: true,
    message: "Admin login successful",
    token: result.token,
    admin: result.admin,
  });
});

exports.getDashboard = asyncHandler(async (req, res) => {
  const stats = await adminService.getDashboardStats();
  res.json({ success: true, stats });
});

exports.getVendorApplications = asyncHandler(async (req, res) => {
  const applications = await adminService.getVendorApplications(req.query.status);
  res.json({ success: true, applications });
});

exports.approveVendorApplication = asyncHandler(async (req, res) => {
  const result = await adminService.approveVendorApplication(
    req.params.id,
    req.admin._id,
    req.body.password
  );
  res.json({ success: true, ...result });
});

exports.rejectVendorApplication = asyncHandler(async (req, res) => {
  const application = await adminService.rejectVendorApplication(
    req.params.id,
    req.admin._id,
    req.body.adminNotes
  );
  res.json({ success: true, message: "Application rejected", application });
});

exports.getUsers = asyncHandler(async (req, res) => {
  const users = await adminService.getAllUsers();
  res.json({ success: true, users });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  await adminService.deleteUser(req.params.id);
  res.json({ success: true, message: "User deleted" });
});

exports.getVendors = asyncHandler(async (req, res) => {
  const vendors = await adminService.getAllVendors();
  res.json({ success: true, vendors });
});

exports.getVendorDetail = asyncHandler(async (req, res) => {
  const detail = await adminService.getVendorDetail(req.params.id);
  res.json({ success: true, ...detail });
});

exports.toggleVendor = asyncHandler(async (req, res) => {
  const vendor = await adminService.toggleVendorStatus(req.params.id, req.body.isActive);
  res.json({ success: true, vendor });
});

exports.resetVendorPassword = asyncHandler(async (req, res) => {
  const vendor = await adminService.resetVendorPassword(req.params.id, req.body.password);
  res.json({ success: true, message: "Vendor password updated", vendor });
});

exports.updateListingStatus = asyncHandler(async (req, res) => {
  const listing = await adminService.updateListingStatus(
    req.params.type,
    req.params.id,
    req.body.status
  );
  res.json({ success: true, listing });
});

exports.getBookings = asyncHandler(async (req, res) => {
  const result = await adminService.getAllBookings();
  res.json({ success: true, ...result });
});

exports.getTours = asyncHandler(async (req, res) => {
  const tours = await adminService.getAllTours();
  res.json({ success: true, tours });
});

exports.getHotels = asyncHandler(async (req, res) => {
  const hotels = await adminService.getAllHotels();
  res.json({ success: true, hotels });
});

exports.createTour = asyncHandler(async (req, res) => {
  const tour = await adminService.adminCreateTour(req.body);
  res.status(201).json({ success: true, message: "Tour created", tour });
});

exports.updateTour = asyncHandler(async (req, res) => {
  const tour = await adminService.adminUpdateTour(req.params.id, req.body);
  res.json({ success: true, message: "Tour updated", tour });
});

exports.deleteTour = asyncHandler(async (req, res) => {
  await adminService.adminDeleteTour(req.params.id);
  res.json({ success: true, message: "Tour deleted" });
});

exports.createHotel = asyncHandler(async (req, res) => {
  const hotel = await adminService.adminCreateHotel(req.body);
  res.status(201).json({ success: true, message: "Hotel created", hotel });
});

exports.updateHotel = asyncHandler(async (req, res) => {
  const hotel = await adminService.adminUpdateHotel(req.params.id, req.body);
  res.json({ success: true, message: "Hotel updated", hotel });
});

exports.deleteHotel = asyncHandler(async (req, res) => {
  await adminService.adminDeleteHotel(req.params.id);
  res.json({ success: true, message: "Hotel deleted" });
});

exports.getProfile = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    admin: adminService.toSafeAdmin(req.admin),
  });
});