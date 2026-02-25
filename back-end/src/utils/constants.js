// ──────────────────────────────────────────────
//  Application-wide Constants
// ──────────────────────────────────────────────

module.exports = {
  // Pagination defaults & limits
  PAGINATION: {
    DEFAULT_LIMIT:  10,
    MAX_LIMIT:      50,
    COMMENT_LIMIT:  20,
    MAX_COMMENT_LIMIT: 100,
    FEED_LIMIT:     3,         // Instagram-style: only 3 videos per batch (play instantly)
    FEED_MAX_LIMIT: 10,        // cap for video feeds
    PREFETCH_LIMIT: 3,         // next-page thumbnails included inline
    READY_TO_PLAY:  2,         // first N posts = full media (auto-play ready)
  },

  // Trending window (days)
  TRENDING_WINDOW_DAYS: 7,

  // Allowed fields for user profile update
  USER_UPDATABLE_FIELDS: ["displayName", "bio", "avatarUrl", "isPrivate"],

  // Populate projections (reusable across controllers)
  AUTHOR_SELECT: "username displayName avatarUrl isVerified",

  // Full post projection for feed — includes everything needed to play
  POST_FEED_SELECT:
    "author mediaUrl mediaType thumbnailUrl caption tags shares saves commentCount viewCount " +
    "duration width height aspectRatio isPublic createdAt",
};
