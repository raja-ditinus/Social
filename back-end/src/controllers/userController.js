// ──────────────────────────────────────────────
//  User Controller
// ──────────────────────────────────────────────
const User = require("../models/User");

// POST /api/users — Register / create user
exports.createUser = async (req, res) => {
  const { username, email, displayName, bio, avatarUrl } = req.body;
  const user = await User.create({ username, email, displayName, bio, avatarUrl });
  res.status(201).json({ success: true, data: user });
};

// GET /api/users/:id — Get user profile
exports.getUser = async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-followers -following -savedPosts")
    .lean({ virtuals: true });
  if (!user) return res.status(404).json({ error: "User not found" });

  // Attach counts from the full document (virtuals need arrays)
  const full = await User.findById(req.params.id);
  res.json({
    success: true,
    data: { ...user, followerCount: full.followerCount, followingCount: full.followingCount },
  });
};

// PATCH /api/users/:id — Update profile
exports.updateUser = async (req, res) => {
  if (req.currentUser._id.toString() !== req.params.id) {
    return res.status(403).json({ error: "Cannot edit another user's profile" });
  }

  const allowed = ["displayName", "bio", "avatarUrl", "isPrivate"];
  const updates = {};
  allowed.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  res.json({ success: true, data: user });
};

// POST /api/users/:id/follow
exports.followUser = async (req, res) => {
  const targetId = req.params.id;
  const currentId = req.currentUser._id.toString();
  if (targetId === currentId) return res.status(400).json({ error: "Cannot follow yourself" });

  const target = await User.findById(targetId);
  if (!target) return res.status(404).json({ error: "User not found" });

  await User.findByIdAndUpdate(currentId, { $addToSet: { following: targetId } });
  await User.findByIdAndUpdate(targetId,  { $addToSet: { followers: currentId } });

  res.json({ success: true, message: `Now following ${target.username}` });
};

// POST /api/users/:id/unfollow
exports.unfollowUser = async (req, res) => {
  const targetId = req.params.id;
  const currentId = req.currentUser._id.toString();

  await User.findByIdAndUpdate(currentId, { $pull: { following: targetId } });
  await User.findByIdAndUpdate(targetId,  { $pull: { followers: currentId } });

  res.json({ success: true, message: "Unfollowed successfully" });
};

// GET /api/users/:id/followers
exports.getFollowers = async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate("followers", "username displayName avatarUrl isVerified")
    .lean();
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ success: true, data: user.followers });
};

// GET /api/users/:id/following
exports.getFollowing = async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate("following", "username displayName avatarUrl isVerified")
    .lean();
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ success: true, data: user.following });
};
