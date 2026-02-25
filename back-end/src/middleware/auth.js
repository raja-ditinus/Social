// ──────────────────────────────────────────────
//  Placeholder Auth Middleware
//  Expects header:  x-user-id: <mongoUserId>
//  Replace with real JWT verification when ready.
// ──────────────────────────────────────────────
const mongoose     = require("mongoose");
const asyncHandler = require("./asyncHandler");
const User         = require("../models/User");

const authMiddleware = asyncHandler(async (req, res, next) => {
  const userId = req.headers["x-user-id"];

  if (!userId) {
    return res.status(401).json({ error: "Missing x-user-id header (placeholder auth)" });
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  const user = await User.findById(userId).lean();
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  req.currentUser = user;
  next();
});

module.exports = authMiddleware;
