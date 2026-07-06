const jwt = require("jsonwebtoken");

const signToken = (payload, expiresIn = "7d") =>
  jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn });

const signUserToken = (userId) => signToken({ id: userId, role: "user" });
const signVendorToken = (vendorId) => signToken({ id: vendorId, role: "vendor" });
const signAdminToken = (adminId) => signToken({ id: adminId, role: "admin" });

module.exports = { signUserToken, signVendorToken, signAdminToken };