const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const dns = require('dns');

dns.setServers([
  '0.0.0.0',
  '1.1.1.1'
])

const connectDataBase = require("./config/db");
const { validateEnv } = require("./config/env");
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");
const authRoutes = require("./routes/authRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const userRoutes = require("./routes/userRoutes");
const tourRoutes = require("./routes/tourRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const eventRoutes = require("./routes/eventRoutes");
const hotelRoutes = require("./routes/hotelRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { ensureDefaultAdmin } = require("./services/adminService");
const { ensureDefaultVendor, seedDemoVendorData } = require("./services/vendorService");

const app = express();

// Production frontends (admin static site + local dev). Mobile apps don't need CORS.
const DEFAULT_CORS = [
  "https://tourapplication-admin.onrender.com",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
];
const allowedOrigins = process.env.CORS_ORIGIN
  ? [
      ...new Set([
        ...process.env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean),
        ...DEFAULT_CORS,
      ]),
    ]
  : DEFAULT_CORS;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        return callback(null, true);
      }
      // Allow any *.onrender.com preview during setup
      if (/\.onrender\.com$/i.test(new URL(origin).hostname)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/health", (req, res) => {
  res.json({ success: true, status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tours", tourRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/invoice", require("./routes/invoiceRoutes"));

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  validateEnv();
  await connectDataBase();
  await ensureDefaultAdmin();
  await ensureDefaultVendor();
  await seedDemoVendorData();

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});