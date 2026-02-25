// ──────────────────────────────────────────────
//  Search Controller
// ──────────────────────────────────────────────
const Post = require("../models/Post");
const User = require("../models/User");

// GET /api/search/posts — Search by caption or tags
exports.searchPosts = async (req, res) => {
  const { q, tag } = req.query;
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);

  const query = { isPublic: true, isArchived: false };
  if (q)   query.caption = { $regex: q, $options: "i" };
  if (tag) query.tags = tag.toLowerCase();

  const posts = await Post.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("author", "username displayName avatarUrl isVerified")
    .lean({ virtuals: true });

  res.json({ success: true, data: posts, count: posts.length });
};

// GET /api/search/users — Search by username or displayName
exports.searchUsers = async (req, res) => {
  const { q } = req.query;
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);

  if (!q) return res.status(400).json({ error: "Query parameter 'q' is required" });

  const users = await User.find({
    $or: [
      { username:    { $regex: q, $options: "i" } },
      { displayName: { $regex: q, $options: "i" } },
    ],
  })
    .select("username displayName avatarUrl isVerified bio")
    .limit(limit)
    .lean();

  res.json({ success: true, data: users, count: users.length });
};
