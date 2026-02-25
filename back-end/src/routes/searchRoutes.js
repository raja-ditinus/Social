// ──────────────────────────────────────────────
//  Search Routes
// ──────────────────────────────────────────────
const router       = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const ctrl         = require("../controllers/searchController");

router.get("/posts", asyncHandler(ctrl.searchPosts));
router.get("/users", asyncHandler(ctrl.searchUsers));

module.exports = router;
