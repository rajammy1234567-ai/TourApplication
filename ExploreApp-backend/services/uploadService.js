const fs = require("fs");
const path = require("path");
const multer = require("multer");
const {
  isCloudinaryConfigured,
  uploadImageToCloudinary,
} = require("../config/cloudinary");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".heic",
  ".heif",
]);

const isAllowedImage = (file) => {
  if (file.mimetype?.startsWith("image/")) return true;

  const ext = path.extname(file.originalname || "").toLowerCase();
  if (IMAGE_EXTENSIONS.has(ext)) return true;

  // React Native / Expo often sends application/octet-stream
  if (
    (!file.mimetype || file.mimetype === "application/octet-stream") &&
    IMAGE_EXTENSIONS.has(ext)
  ) {
    return true;
  }

  return false;
};

// Prefer memory storage when Cloudinary is enabled (no local disk needed).
// Fall back to disk for local-only dev without Cloudinary keys.
const storage = isCloudinaryConfigured()
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname || "") || ".jpg";
        const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif"].includes(
          ext.toLowerCase()
        )
          ? ext.toLowerCase()
          : ".jpg";
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`);
      },
    });

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (_req, file, cb) => {
    if (isAllowedImage(file)) {
      cb(null, true);
      return;
    }
    cb(new Error("Only image files are allowed (jpg, png, webp, gif, heic)"));
  },
});

const uploadMiddleware = upload;

const buildPublicUrl = (req, filename) => {
  if (process.env.PUBLIC_API_URL) {
    return `${process.env.PUBLIC_API_URL.replace(/\/$/, "")}/uploads/${filename}`;
  }

  const host = req.get("host");
  const protocol = req.protocol || "http";
  return `${protocol}://${host}/uploads/${filename}`;
};

/**
 * Resolve final public image URL after multer receives the file.
 * Uses Cloudinary when configured, otherwise local /uploads.
 */
const processUploadedImage = async (req, folder = "viztravel/listings") => {
  if (!req.file) {
    return null;
  }

  if (isCloudinaryConfigured()) {
    const uploaded = await uploadImageToCloudinary(req.file, { folder });
    return {
      url: uploaded.url,
      publicId: uploaded.publicId,
      storage: "cloudinary",
      width: uploaded.width,
      height: uploaded.height,
      bytes: uploaded.bytes,
      format: uploaded.format,
    };
  }

  // Local disk fallback
  const filename = req.file.filename;
  return {
    url: buildPublicUrl(req, filename),
    publicId: null,
    storage: "local",
    filename,
  };
};

module.exports = {
  uploadMiddleware,
  buildPublicUrl,
  processUploadedImage,
  isCloudinaryConfigured,
  UPLOAD_DIR,
};
