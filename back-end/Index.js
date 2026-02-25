// ============================================================
//  Social Interaction Framework — Back-End (Reels / TikTok-style)
//  Express + Mongoose | Configurable via .env
// ============================================================

require("dotenv").config();
const express      = require("express");
const cors         = require("cors");
const connectDB    = require("./src/config/db");
const routes       = require("./src/routes");
const errorHandler = require("./src/middleware/errorHandler");

const app = express();

// ──────────────────────────────────────────────
//  Configuration
// ──────────────────────────────────────────────
const PORT        = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

// ──────────────────────────────────────────────
//  Global Middleware
// ──────────────────────────────────────────────
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ──────────────────────────────────────────────
//  API Routes
// ──────────────────────────────────────────────
app.use("/api", routes);

// ──────────────────────────────────────────────
//  Error Handling
// ──────────────────────────────────────────────
app.use(errorHandler);

// ──────────────────────────────────────────────
//  Start Server
// ──────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log("───────────────────────────────────────");
    console.log("  API Routes:");
    console.log("  POST   /api/users                 — Register");
    console.log("  GET    /api/users/:id              — Profile");
    console.log("  PATCH  /api/users/:id              — Update profile");
    console.log("  POST   /api/users/:id/follow       — Follow");
    console.log("  POST   /api/users/:id/unfollow     — Unfollow");
    console.log("  GET    /api/users/:id/followers     — Follower list");
    console.log("  GET    /api/users/:id/following     — Following list");
    console.log("  GET    /api/users/:id/posts         — User posts");
    console.log("  POST   /api/posts                  — Create post");
    console.log("  GET    /api/posts/:id               — Single post");
    console.log("  DELETE /api/posts/:id               — Delete post");
    console.log("  POST   /api/posts/:id/view          — Record view");
    console.log("  POST   /api/posts/:id/like          — Like/unlike");
    console.log("  POST   /api/posts/:id/save          — Save/unsave");
    console.log("  POST   /api/posts/:id/share         — Share");
    console.log("  POST   /api/posts/:id/comments      — Add comment");
    console.log("  GET    /api/posts/:id/comments      — List comments");
    console.log("  GET    /api/comments/:id/replies     — Comment replies");
    console.log("  POST   /api/comments/:id/like        — Like comment");
    console.log("  DELETE /api/comments/:id             — Delete comment");
    console.log("  GET    /api/feed                    — Public feed");
    console.log("  GET    /api/feed/following           — Following feed");
    console.log("  GET    /api/feed/trending            — Trending feed");
    console.log("  GET    /api/me/saved                 — Saved posts");
    console.log("  GET    /api/search/posts             — Search posts");
    console.log("  GET    /api/search/users             — Search users");
    console.log("  GET    /api/health                   — Health check");
    console.log("───────────────────────────────────────");
  });
});

module.exports = app;
