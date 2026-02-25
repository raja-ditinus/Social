import api from './client';
import { ApiResponse, Post, FeedApiResponse, normalizePosts } from '../types';

// ─── Public feed (cursor-based) ─────────────────────────
export const getPublicFeed = async (
  cursor?: string,
  limit = 3,
): Promise<FeedApiResponse> => {
  const params: Record<string, string | number> = { limit };
  if (cursor) {
    params.cursor = cursor;
  }
  const { data } = await api.get('/api/feed', { params });
  return { ...data, data: normalizePosts(data.data) };
};

// ─── Following feed (auth required) ─────────────────────
export const getFollowingFeed = async (
  cursor?: string,
  limit = 3,
): Promise<FeedApiResponse> => {
  const params: Record<string, string | number> = { limit };
  if (cursor) {
    params.cursor = cursor;
  }
  const { data } = await api.get('/api/feed/following', { params });
  return { ...data, data: normalizePosts(data.data) };
};

// ─── Trending feed (page-based) ─────────────────────────
export const getTrendingFeed = async (
  page = 1,
  limit = 3,
): Promise<FeedApiResponse> => {
  const { data } = await api.get('/api/feed/trending', {
    params: { page, limit },
  });
  return { ...data, data: normalizePosts(data.data) };
};

// ─── Saved posts (page-based) ─────────────────────────
export const getSavedPosts = async (
  page = 1,
  limit = 10,
): Promise<ApiResponse<Post[]>> => {
  const { data } = await api.get('/api/me/saved', {
    params: { page, limit },
  });
  return { ...data, data: normalizePosts(data.data) };
};

// ─── Batch media info (optional, for very slow networks) ──
export const batchMedia = async (
  ids: string[],
): Promise<ApiResponse<Post[]>> => {
  const { data } = await api.post('/api/feed/batch-media', { ids });
  return { ...data, data: normalizePosts(data.data) };
};
