// ──────────────────────────────────────────────
//  Comment Routes
// ──────────────────────────────────────────────
const router       = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const auth         = require("../middleware/auth");
const ctrl         = require("../controllers/commentController");
const optionalAuth = require("../middleware/optionalAuth");

router.get("/:id/replies",     optionalAuth, asyncHandler(ctrl.getReplies));
router.post("/:id/like",   auth, asyncHandler(ctrl.likeComment));
router.delete("/:id",      auth, asyncHandler(ctrl.deleteComment));

module.exports = router;
