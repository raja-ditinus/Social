// ──────────────────────────────────────────────
//  Comment Model
// ──────────────────────────────────────────────
const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    post:          { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    author:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text:          { type: String, required: true, maxlength: 1000 },
    likes:         [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null },
  },
  { timestamps: true }
);

// Virtuals
commentSchema.virtual("likeCount").get(function () {
  return this.likes.length;
});

commentSchema.set("toJSON", { virtuals: true });
commentSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Comment", commentSchema);
