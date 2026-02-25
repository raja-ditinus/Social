const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function optionalAuth(req, res, next) {
  try {
    // ✅ 1) Support your current RN app auth (x-user-id)
    const headerUserId = req.headers["x-user-id"];
    if (headerUserId) {
      req.currentUser = { _id: headerUserId };
      return next();
    }

    // ✅ 2) Also support JWT if you add later
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded._id || decoded.userId;
    if (!userId) return next();

    // optional: validate user exists
    const user = await User.findById(userId).select("_id").lean();
    if (user) req.currentUser = user;

    return next();
  } catch (e) {
    return next();
  }
};