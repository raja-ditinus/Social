// ──────────────────────────────────────────────
//  User Model
// ──────────────────────────────────────────────
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username:    { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
    email:       { type: String, required: true, unique: true, trim: true, lowercase: true },
    displayName: { type: String, trim: true, maxlength: 60 },
    bio:         { type: String, maxlength: 300, default: "" },
    avatarUrl:   { type: String, default: "" },
    followers:  [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
following:  [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post", default: [] }],
    isVerified:  { type: Boolean, default: false },
    isPrivate:   { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Virtuals
userSchema.virtual("followerCount").get(function () {
  return Array.isArray(this.followers) ? this.followers.length : 0;
});
userSchema.virtual("followingCount").get(function () {
  return Array.isArray(this.following) ? this.following.length : 0;
});

// Ensure virtuals are included in JSON / Object output
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("User", userSchema);
