const router = require("express").Router();
const { protectVendor } = require("../middlewares/vendorAuth");
const {
  getHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel,
  getMyHotels,
} = require("../controllers/hotelController");

router.get("/", getHotels);

router.get("/vendor/my-listings", protectVendor, getMyHotels);
router.post("/vendor", protectVendor, createHotel);
router.put("/vendor/:id", protectVendor, updateHotel);
router.delete("/vendor/:id", protectVendor, deleteHotel);

router.get("/:id", getHotelById);

module.exports = router;