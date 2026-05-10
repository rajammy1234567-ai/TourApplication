const Invoice = require("../models/Invoice");
const User = require("../models/User");

/**
 * Generate a new invoice for a confirmed booking
 */
const createInvoiceForBooking = async (booking) => {
  try {
    const user = await User.findById(booking.userId);
    
    // Generate a unique invoice number (e.g., INV-2026-XXXX)
    const timestamp = Date.now().toString().slice(-6);
    const invoiceNumber = `INV-${new Date().getFullYear()}-${timestamp}`;

    const invoice = await Invoice.create({
      bookingId: booking._id,
      userId: booking.userId,
      invoiceNumber,
      customerName: user?.fullname || "Traveller",
      customerEmail: user?.email || "",
      packageName: booking.packageName,
      totalAmount: booking.totalAmount,
      paidAmount: booking.paidAmount,
      remainingAmount: booking.remainingAmount,
      paymentStatus: booking.paymentStatus,
      razorpayPaymentId: booking.razorpayPaymentId,
      details: {
        travelers: booking.travelers,
        children: booking.children,
        startDate: booking.startDate,
        endDate: booking.endDate,
      },
    });

    return invoice;
  } catch (error) {
    console.error("Failed to create invoice:", error);
    // Don't throw error to avoid breaking the booking flow, 
    // but log it for debugging
    return null;
  }
};

const getInvoiceByBookingId = async (bookingId) => {
  return await Invoice.findOne({ bookingId });
};

module.exports = {
  createInvoiceForBooking,
  getInvoiceByBookingId,
};
