// ──────────────────────────────────────────────
//  Engagement Controller — Like, Save, Share
// ──────────────────────────────────────────────
const Post = require("../models/Post");
const User = require("../models/User");

// POST /api/posts/:id/like — Like / unlike a post (toggle)
exports.likePost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  const userId = req.currentUser._id;
  const alreadyLiked = post.likes.some((id) => id.toString() === userId.toString());

  if (alreadyLiked) {
    post.likes.pull(userId);
  } else {
    post.likes.addToSet(userId);
  }
  await post.save();

  res.json({ success: true, liked: !alreadyLiked, likeCount: post.likes.length });
};

// POST /api/posts/:id/save — Save / unsave a post (toggle)
exports.savePost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  const userId = req.currentUser._id;
  const user = await User.findById(userId);

  const alreadySaved = user.savedPosts.some((id) => id.toString() === post._id.toString());

  if (alreadySaved) {
    user.savedPosts.pull(post._id);
    post.saves = Math.max(0, post.saves - 1);
  } else {
    user.savedPosts.addToSet(post._id);
    post.saves += 1;
  }

  await Promise.all([user.save(), post.save()]);

  res.json({ success: true, saved: !alreadySaved, saveCount: post.saves });
};

// GET /api/me/saved — Get saved posts for current user
exports.getSavedPosts = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const page  = Math.max(parseInt(req.query.page) || 1, 1);
  const skip  = (page - 1) * limit;

  const user = await User.findById(req.currentUser._id)
    .populate({
      path: "savedPosts",
      options: { sort: { createdAt: -1 }, skip, limit },
      populate: { path: "author", select: "username displayName avatarUrl isVerified" },
    })
    .lean();

  res.json({ success: true, data: user.savedPosts, pagination: { page, limit } });
};

// POST /api/posts/:id/share — Record a share
exports.sharePost = async (req, res) => {
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $inc: { shares: 1 } },
    { new: true }
  );
  if (!post) return res.status(404).json({ error: "Post not found" });
  res.json({ success: true, shareCount: post.shares });
};
