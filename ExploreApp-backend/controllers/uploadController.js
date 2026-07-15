const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const {
  processUploadedImage,
  isCloudinaryConfigured,
} = require("../services/uploadService");

exports.uploadVendorImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No image file provided");
  }

  try {
    const result = await processUploadedImage(req, "viztravel/vendors");

    if (!result?.url) {
      throw new ApiError(500, "Upload failed — no URL returned");
    }

    res.status(201).json({
      success: true,
      message: isCloudinaryConfigured()
        ? "Image uploaded to Cloudinary"
        : "Image uploaded (local storage — add Cloudinary keys for production)",
      url: result.url,
      publicId: result.publicId || undefined,
      storage: result.storage,
    });
  } catch (err) {
    console.error("Upload error:", err.message);
    throw new ApiError(500, err.message || "Image upload failed");
  }
});
