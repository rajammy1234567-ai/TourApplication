const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.id).select("-password");

  if (!token) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    if (!process.env.JWT_SECRET_KEY) {
      return res.status(500).json({ success: false, message: "Authentication is not configured" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

module.exports = { protect };