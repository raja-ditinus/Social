// ──────────────────────────────────────────────
//  Post Controller
// ──────────────────────────────────────────────
const Post    = require("../models/Post");
const Comment = require("../models/Comment");

// POST /api/posts — Create a new post
exports.createPost = async (req, res) => {
  const { mediaUrl, mediaType, thumbnailUrl, caption, tags } = req.body;
  const post = await Post.create({
    author: req.currentUser._id,
    mediaUrl,
    mediaType,
    thumbnailUrl,
    caption,
    tags: tags || [],
  });
  res.status(201).json({ success: true, data: post });
};

// GET /api/posts/:id — Get single post
exports.getPost = async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate("author", "username displayName avatarUrl isVerified")
    .lean({ virtuals: true });
  if (!post) return res.status(404).json({ error: "Post not found" });
  res.json({ success: true, data: post });
};

// DELETE /api/posts/:id — Delete post
exports.deletePost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  if (post.author.toString() !== req.currentUser._id.toString()) {
    return res.status(403).json({ error: "Not authorized to delete this post" });
  }

  await Comment.deleteMany({ post: post._id });
  await post.deleteOne();
  res.json({ success: true, message: "Post deleted" });
};

// POST /api/posts/:id/view — Record a view
exports.recordView = async (req, res) => {
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $inc: { viewCount: 1 } },
    { new: true }
  );
  if (!post) return res.status(404).json({ error: "Post not found" });
  res.json({ success: true, viewCount: post.viewCount });
};

// GET /api/users/:id/posts — User-specific feed (profile posts)
exports.getUserPosts = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const cursor = req.query.cursor;

  const query = { author: req.params.id, isArchived: false };
  if (cursor) query.createdAt = { $lt: new Date(cursor) };

  const posts = await Post.find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .populate("author", "username displayName avatarUrl isVerified")
    .lean({ virtuals: true });

  const hasMore = posts.length > limit;
  if (hasMore) posts.pop();

  const nextCursor = hasMore ? posts[posts.length - 1].createdAt.toISOString() : null;

  res.json({ success: true, data: posts, pagination: { hasMore, nextCursor, limit } });
};
