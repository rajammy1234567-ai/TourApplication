const cloudinary = require("cloudinary").v2;

const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

const isCloudinaryConfigured = () =>
  Boolean(cloudName && apiKey && apiSecret);

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

/**
 * Upload a multer file (memory or disk) to Cloudinary.
 * Returns { url, publicId, bytes, format, width, height }
 */
const uploadImageToCloudinary = async (file, options = {}) => {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env"
    );
  }

  if (!file) {
    throw new Error("No file provided for Cloudinary upload");
  }

  const folder = options.folder || process.env.CLOUDINARY_FOLDER || "viztravel";
  const baseOpts = {
    folder,
    resource_type: "image",
    overwrite: false,
    unique_filename: true,
    use_filename: true,
    transformation: [
      { quality: "auto:good", fetch_format: "auto" },
    ],
  };

  // Memory storage (preferred)
  if (file.buffer) {
    const dataUri = `data:${file.mimetype || "image/jpeg"};base64,${file.buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      ...baseOpts,
      public_id: options.publicId,
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      bytes: result.bytes,
      format: result.format,
      width: result.width,
      height: result.height,
    };
  }

  // Disk storage fallback
  if (file.path) {
    const result = await cloudinary.uploader.upload(file.path, {
      ...baseOpts,
      public_id: options.publicId,
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      bytes: result.bytes,
      format: result.format,
      width: result.width,
      height: result.height,
    };
  }

  throw new Error("Unsupported file object for Cloudinary upload");
};

const deleteCloudinaryImage = async (publicId) => {
  if (!isCloudinaryConfigured() || !publicId) return null;
  return cloudinary.uploader.destroy(publicId, { resource_type: "image" });
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadImageToCloudinary,
  deleteCloudinaryImage,
};
