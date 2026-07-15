const asyncHandler = require("../utils/asyncHandler");
const tourService = require("../services/tourService");

exports.getTours = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  
  const tours = await tourService.getTours({ 
    search: req.query.search,
    page,
    limit
  });
  
  res.json({ success: true, tours, page, limit });
});

exports.getTourById = asyncHandler(async (req, res) => {
  const tour = await tourService.getTourById(req.params.id);
  res.json({ success: true, tour });
});