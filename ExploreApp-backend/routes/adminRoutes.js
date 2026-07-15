const router = require("express").Router();
const { protectAdmin } = require("../middlewares/adminAuth");
const {
  login,
  getDashboard,
  getVendorApplications,
  approveVendorApplication,
  rejectVendorApplication,
  getUsers,
  deleteUser,
  getVendors,
  getVendorDetail,
  toggleVendor,
  resetVendorPassword,
  updateListingStatus,
  getBookings,
  getTours,
  getHotels,
  createTour,
  updateTour,
  deleteTour,
  createHotel,
  updateHotel,
  deleteHotel,
  getProfile,
} = require("../controllers/adminController");

router.post("/login", login);

router.use(protectAdmin);

router.get("/profile", getProfile);
router.get("/dashboard", getDashboard);

router.get("/vendor-applications", getVendorApplications);
router.post("/vendor-applications/:id/approve", approveVendorApplication);
router.post("/vendor-applications/:id/reject", rejectVendorApplication);

router.get("/users", getUsers);
router.delete("/users/:id", deleteUser);

router.get("/vendors", getVendors);
router.get("/vendors/:id", getVendorDetail);
router.patch("/vendors/:id/status", toggleVendor);
router.patch("/vendors/:id/password", resetVendorPassword);

router.get("/tours", getTours);
router.post("/tours", createTour);
router.put("/tours/:id", updateTour);
router.delete("/tours/:id", deleteTour);

router.get("/hotels", getHotels);
router.post("/hotels", createHotel);
router.put("/hotels/:id", updateHotel);
router.delete("/hotels/:id", deleteHotel);

router.patch("/listings/:type/:id/status", updateListingStatus);

router.get("/bookings", getBookings);

module.exports = router;