// ──────────────────────────────────────────────
//  Post Routes
// ──────────────────────────────────────────────
const router       = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const auth         = require("../middleware/auth");
const postCtrl     = require("../controllers/postController");
const engCtrl      = require("../controllers/engagementController");
const commentCtrl  = require("../controllers/commentController");
const optionalAuth = require("../middleware/optionalAuth");
// CRUD
router.post("/",       auth, asyncHandler(postCtrl.createPost));
router.get("/:id",           asyncHandler(postCtrl.getPost));
router.delete("/:id",  auth, asyncHandler(postCtrl.deletePost));

// View
router.post("/:id/view", asyncHandler(postCtrl.recordView));

// Engagement
router.post("/:id/like",  auth, asyncHandler(engCtrl.likePost));
router.post("/:id/save",  auth, asyncHandler(engCtrl.savePost));
router.post("/:id/share", auth, asyncHandler(engCtrl.sharePost));

// Comments on a post
router.post("/:id/comments", auth, optionalAuth, asyncHandler(commentCtrl.addComment));
router.get("/:id/comments",        optionalAuth, asyncHandler(commentCtrl.getComments));

module.exports = router;
