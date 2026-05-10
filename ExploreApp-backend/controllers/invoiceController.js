const Invoice = require("../models/Invoice");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

/**
 * Get invoice details by booking ID
 */
exports.getInvoiceByBookingId = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  
  const invoice = await Invoice.findOne({ bookingId });
  
  if (!invoice) {
    throw new ApiError(404, "Invoice not found for this booking");
  }
  
  // Ensure the user owns this invoice
  if (String(invoice.userId) !== String(req.user._id)) {
    throw new ApiError(403, "You do not have permission to view this invoice");
  }
  
  res.status(200).json({
    success: true,
    invoice
  });
});