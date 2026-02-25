// ──────────────────────────────────────────────
//  Comment Controller
// ──────────────────────────────────────────────
const Post    = require("../models/Post");
const Comment = require("../models/Comment");

// POST /api/posts/:id/comments — Add comment
exports.addComment = async (req, res) => {
  const { text, parentComment } = req.body;

  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  const comment = await Comment.create({
    post: post._id,
    author: req.currentUser._id,
    text,
    parentComment: parentComment || null,
  });

  post.commentCount += 1;
  await post.save();

 const populated = await comment.populate("author", "username displayName avatarUrl isVerified");
const obj = populated.toObject ? populated.toObject({ virtuals: true }) : populated;

res.status(201).json({
  success: true,
  data: {
    ...obj,
    likeCount: 0,
    isLiked: false,
  },
});
};

// GET /api/posts/:id/comments — List top-level comments (paginated)
// exports.getComments = async (req, res) => {
//   const limit = Math.min(parseInt(req.query.limit) || 20, 100);
//   const cursor = req.query.cursor;

//   const query = { post: req.params.id, parentComment: null };
//   if (cursor) query.createdAt = { $lt: new Date(cursor) };

//   const comments = await Comment.find(query)
//     .sort({ createdAt: -1 })
//     .limit(limit + 1)
//     .populate("author", "username displayName avatarUrl isVerified")
//     .lean({ virtuals: true });

//   const hasMore = comments.length > limit;
//   if (hasMore) comments.pop();

//   const nextCursor = hasMore ? comments[comments.length - 1].createdAt.toISOString() : null;

//   res.json({ success: true, data: comments, pagination: { hasMore, nextCursor, limit } });
// };
exports.getComments = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const cursor = req.query.cursor;
  const userId = req.currentUser?._id; // needs optionalAuth or auth on this route

  const query = { post: req.params.id, parentComment: null };
  if (cursor) query.createdAt = { $lt: new Date(cursor) };

  const comments = await Comment.find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .populate("author", "username displayName avatarUrl isVerified")
    .select("+likes") // important if likes is select:false
    .lean({ virtuals: true });

  const hasMore = comments.length > limit;
  if (hasMore) comments.pop();

  const nextCursor = hasMore ? comments[comments.length - 1].createdAt.toISOString() : null;

  const data = comments.map((c) => {
    const likesArr = Array.isArray(c.likes) ? c.likes : [];
    return {
      ...c,
      likeCount: likesArr.length,
      isLiked: userId ? likesArr.some(id => id.toString() === userId.toString()) : false,
      likes: undefined, // optional: remove heavy array
    };
  });

  res.json({ success: true, data, pagination: { hasMore, nextCursor, limit } });
};

// GET /api/comments/:id/replies — Get replies for a comment
// exports.getReplies = async (req, res) => {
//   const limit = Math.min(parseInt(req.query.limit) || 20, 100);
//   const cursor = req.query.cursor;

//   const query = { parentComment: req.params.id };
//   if (cursor) query.createdAt = { $gt: new Date(cursor) }; // oldest first for replies

//   const replies = await Comment.find(query)
//     .sort({ createdAt: 1 })
//     .limit(limit + 1)
//     .populate("author", "username displayName avatarUrl isVerified")
//     .lean({ virtuals: true });

//   const hasMore = replies.length > limit;
//   if (hasMore) replies.pop();

//   const nextCursor = hasMore ? replies[replies.length - 1].createdAt.toISOString() : null;

//   res.json({ success: true, data: replies, pagination: { hasMore, nextCursor, limit } });
// };

exports.getReplies = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const cursor = req.query.cursor;
  const userId = req.currentUser?._id;

  const query = { parentComment: req.params.id };
  if (cursor) query.createdAt = { $gt: new Date(cursor) };

  const replies = await Comment.find(query)
    .sort({ createdAt: 1 })
    .limit(limit + 1)
    .populate("author", "username displayName avatarUrl isVerified")
    .select("+likes")
    .lean({ virtuals: true });

  const hasMore = replies.length > limit;
  if (hasMore) replies.pop();

  const nextCursor = hasMore ? replies[replies.length - 1].createdAt.toISOString() : null;

  const data = replies.map((c) => {
    const likesArr = Array.isArray(c.likes) ? c.likes : [];
    return {
      ...c,
      likeCount: likesArr.length,
      isLiked: userId ? likesArr.some((id) => id.toString() === userId.toString()) : false,
      likes: undefined,
    };
  });

  res.json({ success: true, data, pagination: { hasMore, nextCursor, limit } });
};
// POST /api/comments/:id/like — Like / unlike a comment (toggle)
exports.likeComment = async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return res.status(404).json({ error: "Comment not found" });

  const userId = req.currentUser._id;
  const alreadyLiked = comment.likes.some((id) => id.toString() === userId.toString());

  if (alreadyLiked) {
    comment.likes.pull(userId);
  } else {
    comment.likes.addToSet(userId);
  }
  await comment.save();

  res.json({ success: true, liked: !alreadyLiked, likeCount: comment.likes.length });
};

// DELETE /api/comments/:id — Delete a comment
exports.deleteComment = async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return res.status(404).json({ error: "Comment not found" });
  if (comment.author.toString() !== req.currentUser._id.toString()) {
    return res.status(403).json({ error: "Not authorized to delete this comment" });
  }

  // Remove reply chain
  await Comment.deleteMany({ parentComment: comment._id });
  await comment.deleteOne();

  // Decrement comment count on the post
  await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });

  res.json({ success: true, message: "Comment deleted" });
};
