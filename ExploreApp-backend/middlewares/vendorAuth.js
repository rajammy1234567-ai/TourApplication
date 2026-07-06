const jwt = require("jsonwebtoken");
const Vendor = require("../models/Vendor");

const protectVendor = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, message: "Vendor authentication required" });
    }

    if (!process.env.JWT_SECRET_KEY) {
      return res.status(500).json({ success: false, message: "Authentication is not configured" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (decoded.role !== "vendor") {
      return res.status(401).json({ success: false, message: "Invalid vendor token" });
    }

    const vendor = await Vendor.findById(decoded.id).select("-password");

    if (!vendor || !vendor.isActive) {
      return res.status(401).json({ success: false, message: "Vendor account not found or inactive" });
    }

    req.vendor = vendor;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

module.exports = { protectVendor };