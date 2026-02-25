// ──────────────────────────────────────────────
//  Feed Controller — ONE call = ready to play
//
//  Instagram Reels approach:
//  ┌─────────────────────────────────────────────┐
//  │  ONE  GET /api/feed  returns:               │
//  │  • 3 posts (small batch = fast)             │
//  │  • post[0-1] → priority "play" (auto-play)  │
//  │  • post[2]   → priority "next" (preload)    │
//  │  • prefetch[] → next page thumbnails        │
//  │  • isSaved, isLiked booleans per post       │
//  │  • No second API call needed                │
//  └─────────────────────────────────────────────┘
// ──────────────────────────────────────────────
const Post = require("../models/Post");
const User = require("../models/User");
const {
  PAGINATION: { FEED_LIMIT, FEED_MAX_LIMIT, PREFETCH_LIMIT, READY_TO_PLAY },
  TRENDING_WINDOW_DAYS,
  AUTHOR_SELECT,
  POST_FEED_SELECT,
} = require("../utils/constants");

// ─── helpers ────────────────────────────────────
const parseLimit = (raw) => Math.min(parseInt(raw) || FEED_LIMIT, FEED_MAX_LIMIT);

/**
 * Build a play-ready post object.
 * - Replaces heavy likes[] with likeCount + isLiked
 * - Adds isSaved boolean
 * - Adds priority: "play" | "next" | "preload"
 */
const buildPost = (post, index, userId, savedSet) => {
  const obj = typeof post.toObject === "function"
    ? post.toObject({ virtuals: true })
    : { ...post };

  // Like info
  obj.likeCount = Array.isArray(obj.likes) ? obj.likes.length : obj.likeCount || 0;
  obj.isLiked = userId && Array.isArray(obj.likes)
    ? obj.likes.some((id) => id.toString() === userId.toString())
    : false;
  delete obj.likes;

  // Save info
  obj.isSaved = savedSet ? savedSet.has(obj._id.toString()) : false;

  // Play priority — tells the client what to do with each post
  //   "play"    → load video immediately, auto-play when visible
  //   "next"    → preload video in background, play when user scrolls
  //   "preload" → show thumbnail only, fetch video on demand
  if (index < READY_TO_PLAY) {
    obj.priority = "play";
  } else {
    obj.priority = "next";
  }

  return obj;
};

/**
 * Get the set of post IDs the user has saved (for isSaved boolean).
 */
const getSavedSet = async (userId) => {
  if (!userId) return null;
  const user = await User.findById(userId).select("savedPosts").lean();
  return new Set((user?.savedPosts || []).map((id) => id.toString()));
};

/**
 * Prefetch: minimal data for the NEXT page (thumbnails only).
 * Included inline — no separate API call needed.
 */
const getPrefetchItems = async (query, sort, limit) => {
  return Post.find(query)
    .sort(sort)
    .limit(limit)
    .select("thumbnailUrl mediaType aspectRatio duration")
    .lean();
};

// ═══════════════════════════════════════════════
//  GET /api/feed — Public feed (ONE call, play-ready)
// ═══════════════════════════════════════════════
exports.publicFeed = async (req, res) => {
  const limit  = parseLimit(req.query.limit);
  const cursor = req.query.cursor;
  const userId = req.currentUser?._id;

  const query = { isPublic: true, isArchived: false };
  if (cursor) query.createdAt = { $lt: new Date(cursor) };

  // Fetch posts + savedPosts in parallel (one DB round-trip each)
  const [posts, savedSet] = await Promise.all([
    Post.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .select(`${POST_FEED_SELECT} likes +likes`)
      .populate("author", AUTHOR_SELECT)
      .lean({ virtuals: true }),
    getSavedSet(userId),
  ]);

  const hasMore = posts.length > limit;
  if (hasMore) posts.pop();

  const nextCursor = hasMore
    ? posts[posts.length - 1].createdAt.toISOString()
    : null;

  // Build prefetch for next page (inline, no extra call)
  let prefetch = [];
  if (hasMore) {
    prefetch = await getPrefetchItems(
      { isPublic: true, isArchived: false, createdAt: { $lt: new Date(nextCursor) } },
      { createdAt: -1 },
      PREFETCH_LIMIT
    );
  }

  res.json({
    success: true,
    data: posts.map((p, i) => buildPost(p, i, userId, savedSet)),
    pagination: { hasMore, nextCursor, limit },
    prefetch,
  });
};

// ═══════════════════════════════════════════════
//  GET /api/feed/following — Following feed (ONE call)
// ═══════════════════════════════════════════════
exports.followingFeed = async (req, res) => {
  const limit  = parseLimit(req.query.limit);
  const cursor = req.query.cursor;
  const userId = req.currentUser._id;

  // Fetch following list + savedPosts in parallel
  const [userData, savedSet] = await Promise.all([
    User.findById(userId).select("following savedPosts").lean(),
    null, // we'll get savedPosts from userData directly
  ]);

  const followingIds = userData?.following || [];
  const savedPostSet = new Set((userData?.savedPosts || []).map((id) => id.toString()));

  const query = {
    author: { $in: followingIds },
    isPublic: true,
    isArchived: false,
  };
  if (cursor) query.createdAt = { $lt: new Date(cursor) };

  const posts = await Post.find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .select(POST_FEED_SELECT + " likes")
    .populate("author", AUTHOR_SELECT)
    .lean({ virtuals: true });

  const hasMore = posts.length > limit;
  if (hasMore) posts.pop();

  const nextCursor = hasMore
    ? posts[posts.length - 1].createdAt.toISOString()
    : null;

  let prefetch = [];
  if (hasMore) {
    prefetch = await getPrefetchItems(
      { ...query, createdAt: { $lt: new Date(nextCursor) } },
      { createdAt: -1 },
      PREFETCH_LIMIT
    );
  }

  res.json({
    success: true,
    data: posts.map((p, i) => buildPost(p, i, userId, savedPostSet)),
    pagination: { hasMore, nextCursor, limit },
    prefetch,
  });
};

// ═══════════════════════════════════════════════
//  GET /api/feed/trending — Trending feed (ONE call)
// ═══════════════════════════════════════════════
exports.trendingFeed = async (req, res) => {
  const limit  = parseLimit(req.query.limit);
  const page   = Math.max(parseInt(req.query.page) || 1, 1);
  const skip   = (page - 1) * limit;

  const userId = req.currentUser?._id;
  const userObjectId = userId ? new mongoose.Types.ObjectId(userId) : null;

  const since = new Date();
  since.setDate(since.getDate() - TRENDING_WINDOW_DAYS);

  const [posts, savedSet] = await Promise.all([
    Post.aggregate([
      { $match: { isPublic: true, isArchived: false, createdAt: { $gte: since } } },
      {
        $addFields: {
          likeCount: { $size: { $ifNull: ["$likes", []] } },

          engagementScore: {
            $add: [
              { $size: { $ifNull: ["$likes", []] } },
              { $ifNull: ["$viewCount", 0] },
              { $multiply: [{ $ifNull: ["$shares", 0] }, 2] },
            ],
          },

         isLiked: userObjectId
  ? {
      $in: [
        userObjectId.toString(),
        {
          $map: {
            input: { $ifNull: ["$likes", []] },
            as: "id",
            in: { $toString: "$$id" }
          }
        }
      ]
    }
  : false,
        },
      },
      { $sort: { engagementScore: -1 } },
      { $skip: skip },
      { $limit: limit },
      { $project: { likes: 0 } },
    ]),
    userId ? getSavedSet(userId) : new Set(),
  ]);

  await Post.populate(posts, { path: "author", select: AUTHOR_SELECT });

  const data = posts.map((p, i) => {
    // ✅ DO NOT overwrite p.isLiked here
    p.isSaved = savedSet.has(p._id.toString());
    p.priority = i < READY_TO_PLAY ? "play" : "next";
    return p;
  });

  res.json({ success: true, data, pagination: { page, limit } });
};
// exports.trendingFeed = async (req, res) => {
//   const limit  = parseLimit(req.query.limit);
//   const page   = Math.max(parseInt(req.query.page) || 1, 1);
//   const skip   = (page - 1) * limit;
//   const userId = req.currentUser?._id;

//   const since = new Date();
//   since.setDate(since.getDate() - TRENDING_WINDOW_DAYS);

//   // Fetch posts + savedPosts in parallel
//   const [posts, savedSet] = await Promise.all([
//     Post.aggregate([
//       { $match: { isPublic: true, isArchived: false, createdAt: { $gte: since } } },
//       {
//         $addFields: {
//           likeCount: { $size: "$likes" },
//           engagementScore: {
//             $add: [{ $size: "$likes" }, "$viewCount", { $multiply: ["$shares", 2] }],
//           },
//            isLiked: userObjectId
//             ? { $in: [userObjectId, { $ifNull: ["$likes", []] }] }
//             : false,
//         },
//       },
      
//       { $sort: { engagementScore: -1 } },
//       { $skip: skip },
//       { $limit: limit },
//       { $project: { likes: 0 } },
//     ]),
//     getSavedSet(userId),
//   ]);

//   await Post.populate(posts, { path: "author", select: AUTHOR_SELECT });

//   // Add priority + isSaved to trending posts too
//   const data = posts.map((p, i) => {
//     p.isLiked = false; // can't compute from aggregation (likes already removed)
//     p.isSaved = savedSet ? savedSet.has(p._id.toString()) : false;
//     p.priority = i < READY_TO_PLAY ? "play" : "next";
//     return p;
//   });

//   res.json({
//     success: true,
//     data,
//     pagination: { page, limit },
//   });
// };

// ═══════════════════════════════════════════════
//  POST /api/feed/batch-media — Optional lazy-load (still available)
//  Use this ONLY if you want to load videos one-by-one on very slow networks.
//  With the new feed, you normally DON'T need this anymore.
// ═══════════════════════════════════════════════
exports.batchMedia = async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: "ids[] is required" });
  }

  const media = await Post.find({ _id: { $in: ids.slice(0, 20) } })
    .select("mediaUrl mediaType thumbnailUrl duration width height aspectRatio")
    .lean();

  res.json({ success: true, data: media });
};
