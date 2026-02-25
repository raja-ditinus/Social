// ──────────────────────────────────────────────
//  Global Error Handler
// ──────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  console.error("❌ Error:", err.message);
   console.error(err.stack);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: "Validation failed", details: messages });
  }

  // Duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({ error: "Duplicate field value", details: err.keyValue });
  }

  // Default
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
};

module.exports = errorHandler;
