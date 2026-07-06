const fs = require("fs");
const path = require("path");
const multer = require("multer");
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "") || ".jpg";
    const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext.toLowerCase())
      ? ext.toLowerCase()
      : ".jpg";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`);
  },
});

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

  // React Native / Expo often sends application/octet-stream without a reliable mimetype.
  if (
    (!file.mimetype || file.mimetype === "application/octet-stream") &&
    IMAGE_EXTENSIONS.has(ext)
  ) {
    return true;
  }

  return false;
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (isAllowedImage(file)) {
      cb(null, true);
      return;
    }
    cb(new Error("Only image files are allowed (jpg, png, webp, gif)"));
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

module.exports = {
  uploadMiddleware,
  buildPublicUrl,
  UPLOAD_DIR,
};