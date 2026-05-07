const ApiError = require("../utils/ApiError");

const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  const isProduction = process.env.NODE_ENV === "production";

  if (statusCode >= 500) {
    console.error("Server error", {
      message: err.message,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
    });
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 && isProduction ? "Internal server error" : err.message,
    ...(err.details ? { details: err.details } : {}),
  });
};

module.exports = { notFound, errorHandler };