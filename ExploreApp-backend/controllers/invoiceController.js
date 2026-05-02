const generateInvoice = require("../utils/generateInvoice");

exports.downloadInvoice = async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  const filePath = generateInvoice(booking);

  res.download(filePath);
};