const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { buildPublicUrl } = require("../services/uploadService");

exports.uploadVendorImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No image file provided");
  }

  const url = buildPublicUrl(req, req.file.filename);

  res.status(201).json({
    success: true,
    message: "Image uploaded",
    url,
  });
});