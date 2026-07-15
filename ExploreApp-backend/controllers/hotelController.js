const asyncHandler = require("../utils/asyncHandler");
const hotelService = require("../services/hotelService");

exports.getHotels = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;

  const hotels = await hotelService.getHotels({
    search: req.query.search,
    city: req.query.city,
    propertyType: req.query.propertyType,
    page,
    limit,
  });

  res.json({ success: true, hotels, page, limit });
});

exports.getHotelById = asyncHandler(async (req, res) => {
  const hotel = await hotelService.getHotelById(req.params.id);
  res.json({ success: true, hotel });
});

exports.createHotel = asyncHandler(async (req, res) => {
  const hotel = await hotelService.createHotel(req.vendor._id, req.body);
  res.status(201).json({
    success: true,
    message: "Hotel submitted for admin approval",
    hotel,
  });
});

exports.updateHotel = asyncHandler(async (req, res) => {
  const hotel = await hotelService.updateHotel(req.vendor._id, req.params.id, req.body);
  res.json({
    success: true,
    message: "Hotel updated and sent for re-approval",
    hotel,
  });
});

exports.deleteHotel = asyncHandler(async (req, res) => {
  await hotelService.deleteHotel(req.vendor._id, req.params.id);
  res.json({ success: true, message: "Hotel deleted" });
});

exports.getMyHotels = asyncHandler(async (req, res) => {
  const hotels = await hotelService.getVendorHotels(req.vendor._id);
  res.json({ success: true, hotels });
});

exports.getVendorHotelById = asyncHandler(async (req, res) => {
  const hotel = await hotelService.getVendorHotelById(req.vendor._id, req.params.id);
  res.json({ success: true, hotel });
});