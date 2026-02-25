// ──────────────────────────────────────────────
//  Engagement Routes (saved posts for current user)
// ──────────────────────────────────────────────
const router       = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const auth         = require("../middleware/auth");
const ctrl         = require("../controllers/engagementController");

router.get("/saved", auth, asyncHandler(ctrl.getSavedPosts));

module.exports = router;
