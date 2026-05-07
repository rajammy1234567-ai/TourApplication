const asyncHandler = require("../utils/asyncHandler");
const tourService = require("../services/tourService");

exports.getTours = asyncHandler(async (req, res) => {
  const tours = await tourService.getTours({ search: req.query.search });
  res.json({ success: true, tours });
});

exports.getTourById = asyncHandler(async (req, res) => {
  const tour = await tourService.getTourById(req.params.id);
  res.json({ success: true, tour });
});