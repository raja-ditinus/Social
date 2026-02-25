// ──────────────────────────────────────────────
//  Barrel export — mount all route groups
// ──────────────────────────────────────────────
const router = require("express").Router();

router.use("/users",    require("./userRoutes"));
router.use("/posts",    require("./postRoutes"));
router.use("/feed",     require("./feedRoutes"));
router.use("/comments", require("./commentRoutes"));
router.use("/me",       require("./meRoutes"));
router.use("/search",   require("./searchRoutes"));

// Health check
router.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

module.exports = router;
