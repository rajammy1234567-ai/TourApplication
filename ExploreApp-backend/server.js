const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDataBase = require("./config/db");
const { validateEnv } = require("./config/env");
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");
const authRoutes = require("./routes/authRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const userRoutes = require("./routes/userRoutes");
const tourRoutes = require("./routes/tourRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const eventRoutes = require("./routes/eventRoutes");

const app = express();
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : true;

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => {
  res.json({ success: true, status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/auth", userRoutes);
app.use("/api/tours", tourRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/invoice", require("./routes/invoiceRoutes"));

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  validateEnv();
  await connectDataBase();

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});