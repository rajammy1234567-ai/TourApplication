const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const protectAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, message: "Admin authentication required" });
    }

    if (!process.env.JWT_SECRET_KEY) {
      return res.status(500).json({ success: false, message: "Authentication is not configured" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (decoded.role !== "admin") {
      return res.status(401).json({ success: false, message: "Invalid admin token" });
    }

    const admin = await Admin.findById(decoded.id).select("-password");

    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, message: "Admin account not found or inactive" });
    }

    req.admin = admin;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

module.exports = { protectAdmin };