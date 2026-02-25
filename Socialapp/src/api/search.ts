import api from './client';
import { ApiResponse, Post, User, normalizePosts, normalizeUsers } from '../types';

export const searchPosts = async (
  q: string,
  limit = 10,
): Promise<ApiResponse<Post[]>> => {
  const { data } = await api.get('/api/search/posts', { params: { q, limit } });
  return { ...data, data: normalizePosts(data.data) };
};

export const searchByTag = async (
  tag: string,
  limit = 10,
): Promise<ApiResponse<Post[]>> => {
  const { data } = await api.get('/api/search/posts', { params: { tag, limit } });
  return { ...data, data: normalizePosts(data.data) };
};

export const searchUsers = async (
  q: string,
  limit = 10,
): Promise<ApiResponse<User[]>> => {
  const { data } = await api.get('/api/search/users', { params: { q, limit } });
  return { ...data, data: normalizeUsers(data.data) };
};

// ─── Health check ───────────────────────────────────────
export const healthCheck = async (): Promise<any> => {
  const { data } = await api.get('/api/health');
  return data;
};
