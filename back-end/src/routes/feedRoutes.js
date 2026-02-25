// ──────────────────────────────────────────────
//  Feed Routes — ONE call = ready to play
// ──────────────────────────────────────────────
const router       = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const auth         = require("../middleware/auth");
const ctrl         = require("../controllers/feedController");
const optionalAuth = require("../middleware/optionalAuth");
router.get("/",            optionalAuth, asyncHandler(ctrl.publicFeed));       // ONE call → play-ready
router.get("/following",   auth, asyncHandler(ctrl.followingFeed));
router.get("/trending",    asyncHandler(ctrl.trendingFeed));
router.post("/batch-media", asyncHandler(ctrl.batchMedia));      // optional: slow network only

module.exports = router;
