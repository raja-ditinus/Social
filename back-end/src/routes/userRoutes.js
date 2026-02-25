// ──────────────────────────────────────────────
//  User Routes
// ──────────────────────────────────────────────
const router       = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const auth         = require("../middleware/auth");
const ctrl         = require("../controllers/userController");

router.post("/",             asyncHandler(ctrl.createUser));
router.get("/:id",           asyncHandler(ctrl.getUser));
router.patch("/:id",  auth,  asyncHandler(ctrl.updateUser));

// Follow system
router.post("/:id/follow",   auth, asyncHandler(ctrl.followUser));
router.post("/:id/unfollow", auth, asyncHandler(ctrl.unfollowUser));
router.get("/:id/followers",       asyncHandler(ctrl.getFollowers));
router.get("/:id/following",       asyncHandler(ctrl.getFollowing));

// User's posts (profile feed)
const postCtrl = require("../controllers/postController");
router.get("/:id/posts", asyncHandler(postCtrl.getUserPosts));

module.exports = router;
