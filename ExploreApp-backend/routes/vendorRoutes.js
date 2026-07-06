const router = require("express").Router();
const { protect } = require("../middlewares/authMiddleware");
const { protectVendor } = require("../middlewares/vendorAuth");
const {
  applyAsVendor,
  getMyApplication,
  login,
  getDashboard,
  getMyTours,
  createTour,
  updateTour,
  deleteTour,
  getProfile,
  getBookings,
  getActivity,
} = require("../controllers/vendorController");

router.post("/login", login);

router.post("/apply", protect, applyAsVendor);
router.get("/application", protect, getMyApplication);

router.get("/profile", protectVendor, getProfile);
router.get("/dashboard", protectVendor, getDashboard);
router.get("/bookings", protectVendor, getBookings);
router.get("/activity", protectVendor, getActivity);
router.get("/tours", protectVendor, getMyTours);
router.post("/tours", protectVendor, createTour);
router.put("/tours/:id", protectVendor, updateTour);
router.delete("/tours/:id", protectVendor, deleteTour);

module.exports = router;