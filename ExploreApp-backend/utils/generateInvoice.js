const PDFDocument = require("pdfkit");
const fs = require("fs");

module.exports = (booking) => {
  const path = `backend/invoices/${booking._id}.pdf`;

  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(path));

  doc.text("Travel Invoice");
  doc.text(`Package: ${booking.packageName}`);
  doc.text(`Total: ₹${booking.totalAmount}`);
  doc.text(`Paid: ₹${booking.advanceAmount}`);

  doc.end();

  return path;
};