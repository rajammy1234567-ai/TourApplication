const router = require("express").Router();
const { getInvoiceByBookingId } = require("../controllers/invoiceController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/booking/:bookingId", protect, getInvoiceByBookingId);

module.exports = router;