// ──────────────────────────────────────────────
//  Post Model (Reel / Short Video)
// ──────────────────────────────────────────────
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    author:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mediaUrl:     { type: String, required: true },
    mediaType:    { type: String, enum: ["video", "image"], default: "video" },
    thumbnailUrl: { type: String, default: "" },
    caption:      { type: String, maxlength: 2200, default: "" },
    tags:         [{ type: String, trim: true, lowercase: true }],
    likes:        [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    shares:       { type: Number, default: 0 },
    saves:        { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    viewCount:    { type: Number, default: 0 },
    duration:     { type: Number, default: 0 },           // video duration in seconds
    width:        { type: Number, default: 0 },           // media width in px
    height:       { type: Number, default: 0 },           // media height in px
    aspectRatio:  { type: String, default: "9:16" },       // e.g. "9:16", "1:1", "16:9"
    isPublic:     { type: Boolean, default: true },
    isArchived:   { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Virtuals
postSchema.virtual("likeCount").get(function () {
  return this.likes.length;
});

postSchema.set("toJSON", { virtuals: true });
postSchema.set("toObject", { virtuals: true });

// Indexes
postSchema.index({ createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ isPublic: 1, isArchived: 1, createdAt: -1 });       // public feed
postSchema.index({ author: 1, isPublic: 1, isArchived: 1, createdAt: -1 }); // following feed

module.exports = mongoose.model("Post", postSchema);
