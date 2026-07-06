const asyncHandler = require("../utils/asyncHandler");
const vendorService = require("../services/vendorService");

exports.applyAsVendor = asyncHandler(async (req, res) => {
  const application = await vendorService.submitApplication(req.user._id, req.body);
  res.status(201).json({
    success: true,
    message: "Vendor application submitted. Admin will review it soon.",
    application,
  });
});

exports.getMyApplication = asyncHandler(async (req, res) => {
  const application = await vendorService.getMyApplication(req.user._id);
  res.json({ success: true, application });
});

exports.login = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;
  const result = await vendorService.vendorLogin(phone, password);
  res.json({
    success: true,
    message: "Vendor login successful",
    token: result.token,
    vendor: result.vendor,
  });
});

exports.getDashboard = asyncHandler(async (req, res) => {
  const dashboard = await vendorService.getVendorDashboard(req.vendor._id);
  res.json({ success: true, dashboard });
});

exports.getMyTours = asyncHandler(async (req, res) => {
  const tours = await vendorService.getVendorTours(req.vendor._id);
  res.json({ success: true, tours });
});

exports.createTour = asyncHandler(async (req, res) => {
  const tour = await vendorService.createTour(req.vendor._id, req.body);
  res.status(201).json({
    success: true,
    message: "Tour submitted for admin approval",
    tour,
  });
});

exports.updateTour = asyncHandler(async (req, res) => {
  const tour = await vendorService.updateTour(req.vendor._id, req.params.id, req.body);
  res.json({
    success: true,
    message: "Tour updated and sent for re-approval",
    tour,
  });
});

exports.deleteTour = asyncHandler(async (req, res) => {
  await vendorService.deleteTour(req.vendor._id, req.params.id);
  res.json({ success: true, message: "Tour deleted" });
});

exports.getProfile = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    vendor: vendorService.toSafeVendor(req.vendor),
  });
});

exports.getBookings = asyncHandler(async (req, res) => {
  const bookings = await vendorService.getVendorBookings(req.vendor._id);
  res.json({ success: true, bookings });
});

exports.getActivity = asyncHandler(async (req, res) => {
  const activity = await vendorService.getVendorActivity(req.vendor._id);
  res.json({ success: true, activity });
});