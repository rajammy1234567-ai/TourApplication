const router = require("express").Router();
const { protect } = require("../middlewares/authMiddleware");
const { protectVendor } = require("../middlewares/vendorAuth");
const {
  applyAsVendor,
  getMyApplication,
  login,
  getDashboard,
  getMyTours,
  getTourById,
  createTour,
  updateTour,
  deleteTour,
  getProfile,
  getBookings,
  getActivity,
} = require("../controllers/vendorController");
const { uploadVendorImage } = require("../controllers/uploadController");
const { uploadMiddleware } = require("../services/uploadService");

router.post("/login", login);

router.post("/apply", protect, applyAsVendor);
router.get("/application", protect, getMyApplication);

router.get("/profile", protectVendor, getProfile);
router.get("/dashboard", protectVendor, getDashboard);
router.get("/bookings", protectVendor, getBookings);
router.get("/activity", protectVendor, getActivity);
const handleVendorUpload = (req, res, next) => {
  uploadMiddleware.single("image")(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(Object.assign(new Error("Image must be smaller than 5 MB"), { statusCode: 400 }));
    }
    return next(Object.assign(err, { statusCode: 400 }));
  });
};

router.post("/upload", protectVendor, handleVendorUpload, uploadVendorImage);
router.get("/tours", protectVendor, getMyTours);
router.get("/tours/:id", protectVendor, getTourById);
router.post("/tours", protectVendor, createTour);
router.put("/tours/:id", protectVendor, updateTour);
router.delete("/tours/:id", protectVendor, deleteTour);

module.exports = router;