import api from './client';
import { ApiResponse, User, Post, normalizeUser, normalizeUsers, normalizePosts } from '../types';

// ─── Register ───────────────────────────────────────────
export const register = async (body: {
  username: string;
  email: string;
  displayName: string;
  bio?: string;
}): Promise<ApiResponse<User>> => {
  const { data } = await api.post('/api/users', body);
  return { ...data, data: normalizeUser(data.data) };
};

// ─── Get profile ────────────────────────────────────────
export const getUser = async (id: string): Promise<ApiResponse<User>> => {
  const { data } = await api.get(`/api/users/${id}`);
  return { ...data, data: normalizeUser(data.data) };
};

// ─── Update profile ─────────────────────────────────────
export const updateUser = async (
  id: string,
  body: Partial<Pick<User, 'displayName' | 'bio' | 'avatarUrl'>>,
): Promise<ApiResponse<User>> => {
  const { data } = await api.patch(`/api/users/${id}`, body);
  return { ...data, data: normalizeUser(data.data) };
};

// ─── Follow / Unfollow ──────────────────────────────────
export const followUser = async (
  id: string,
): Promise<ApiResponse<{ message: string }>> => {
  const { data } = await api.post(`/api/users/${id}/follow`);
  return data;
};

export const unfollowUser = async (
  id: string,
): Promise<ApiResponse<{ message: string }>> => {
  const { data } = await api.post(`/api/users/${id}/unfollow`);
  return data;
};

// ─── Followers / Following lists ────────────────────────
export const getFollowers = async (
  id: string,
): Promise<ApiResponse<User[]>> => {
  const { data } = await api.get(`/api/users/${id}/followers`);
  return { ...data, data: normalizeUsers(data.data) };
};

export const getFollowing = async (
  id: string,
): Promise<ApiResponse<User[]>> => {
  const { data } = await api.get(`/api/users/${id}/following`);
  return { ...data, data: normalizeUsers(data.data) };
};

// ─── User's posts (cursor-based) ───────────────────────
export const getUserPosts = async (
  id: string,
  cursor?: string,
  limit = 5,
): Promise<ApiResponse<Post[]>> => {
  const params: Record<string, string | number> = { limit };
  if (cursor) {
    params.cursor = cursor;
  }
  const { data } = await api.get(`/api/users/${id}/posts`, { params });
  return { ...data, data: normalizePosts(data.data) };
};
