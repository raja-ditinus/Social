// ─── User ───────────────────────────────────────────────
export interface User {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  bio: string;
  avatarUrl?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing?: boolean;
  isVerified?: boolean;
  isPrivate?: boolean;
  createdAt: string;
}

/**
 * Backend User has: followers (array), following (array),
 * followerCount (virtual), followingCount (virtual).
 * Frontend expects: followersCount, followingCount, postsCount.
 */
export function normalizeUser(raw: any): User {
  return {
    ...raw,
    followersCount:
      raw.followersCount ??
      raw.followerCount ??
      (Array.isArray(raw.followers) ? raw.followers.length : 0),
    followingCount:
      raw.followingCount ??
      (Array.isArray(raw.following) ? raw.following.length : 0),
    postsCount: raw.postsCount ?? raw.postCount ?? 0,
  };
}

export function normalizeUsers(rawList: any[]): User[] {
  return (rawList ?? []).map(normalizeUser);
}

// ─── Post / Reel ────────────────────────────────────────
export interface Post {
  _id: string;
  author: User;
  mediaUrl: string;
  mediaType: 'video' | 'image';
  thumbnailUrl?: string;
  caption: string;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  sharesCount: number;
  viewsCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  priority?: 'play' | 'next';
  duration?: number;
  width?: number;
  height?: number;
  aspectRatio?: string;
  createdAt: string;
}

/**
 * Backend Post has: likes (array), likeCount (virtual),
 * saves (number), shares (number), commentCount, viewCount.
 * Frontend expects: likesCount, savesCount, sharesCount, commentsCount, viewsCount.
 */
export function normalizePost(raw: any): Post {
  return {
    ...raw,
    author: raw.author ? normalizeUser(raw.author) : raw.author,
    likesCount:
      raw.likesCount ??
      raw.likeCount ??
      (Array.isArray(raw.likes) ? raw.likes.length : 0),
    savesCount: raw.savesCount ?? raw.saves ?? 0,
    sharesCount: raw.sharesCount ?? raw.shares ?? 0,
    commentsCount: raw.commentsCount ?? raw.commentCount ?? 0,
    viewsCount: raw.viewsCount ?? raw.viewCount ?? 0,
    isLiked: raw.isLiked ?? false,
    isSaved: raw.isSaved ?? false,
    priority: raw.priority ?? 'next',
    tags: raw.tags ?? [],
  };
}

export function normalizePosts(rawList: any[]): Post[] {
  return (rawList ?? []).map(normalizePost);
}

// ─── Comment ────────────────────────────────────────────
export interface Comment {
  _id: string;
  text: string;
  createdAt: string;
  author: {
    _id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    isVerified?: boolean;
  };

  // ✅ add these (new backend format)
  likeCount?: number;
  isLiked?: boolean;

  // ✅ keep old field if you already use it somewhere
  likesCount?: number;
}


/**
 * Backend Comment has: likes (array), likeCount (virtual).
 * Frontend expects: likesCount, repliesCount.
 */
export function normalizeComment(raw: any): Comment {
  const count =
    raw.likesCount ??
    raw.likeCount ??
    (Array.isArray(raw.likes) ? raw.likes.length : 0);

  return {
    ...raw,
    author: raw.author ? normalizeUser(raw.author) : raw.author,

    likesCount: count,
    likeCount: count,

    repliesCount: raw.repliesCount ?? raw.replyCount ?? 0,
    isLiked: raw.isLiked ?? false,
  };
}

export function normalizeComments(rawList: any[]): Comment[] {
  return (rawList ?? []).map(normalizeComment);
}

// ─── API Response ───────────────────────────────────────
export interface Pagination {
  hasMore: boolean;
  nextCursor?: string;
  limit: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: Pagination;
}

// ─── Prefetch item (lightweight post preview) ───────────
export interface PrefetchItem {
  _id: string;
  thumbnailUrl?: string;
  mediaUrl?: string;
  mediaType: 'video' | 'image';
  aspectRatio?: string;
  duration?: number;
}

export interface FeedApiResponse extends ApiResponse<Post[]> {
  prefetch?: PrefetchItem[];
}

// ─── Auth context ───────────────────────────────────────
export interface AuthState {
  userId: string | null;
  user: User | null;
  isLoading: boolean;
}
