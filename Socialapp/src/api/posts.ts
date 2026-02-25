import api from './client';
import { ApiResponse, Post, Comment, normalizePost, normalizeComment, normalizeComments } from '../types';

// ─── Create post ────────────────────────────────────────
export const createPost = async (body: {
  mediaUrl: string;
  mediaType: 'video' | 'image';
  thumbnailUrl?: string;
  caption: string;
  tags?: string[];
}): Promise<ApiResponse<Post>> => {
  const { data } = await api.post('/api/posts', body);
  return { ...data, data: normalizePost(data.data) };
};

// ─── Get single post ────────────────────────────────────
export const getPost = async (id: string): Promise<ApiResponse<Post>> => {
  const { data } = await api.get(`/api/posts/${id}`);
  return { ...data, data: normalizePost(data.data) };
};

// ─── Delete post ────────────────────────────────────────
export const deletePost = async (
  id: string,
): Promise<ApiResponse<{ message: string }>> => {
  const { data } = await api.delete(`/api/posts/${id}`);
  return data;
};

// ─── Interactions ───────────────────────────────────────
export const recordView = async (
  id: string,
): Promise<ApiResponse<{ viewsCount: number }>> => {
  const { data } = await api.post(`/api/posts/${id}/view`);
  return data;
};

export const toggleLike = async (
  id: string,
): Promise<ApiResponse<{ liked: boolean; likeCount: number }>> => {
  const { data } = await api.post(`/api/posts/${id}/like`);
  return data;
};

export const toggleSave = async (
  id: string,
): Promise<ApiResponse<{ saved: boolean; savesCount: number }>> => {
  const { data } = await api.post(`/api/posts/${id}/save`);
  return data;
};

export const recordShare = async (
  id: string,
): Promise<ApiResponse<{ sharesCount: number }>> => {
  const { data } = await api.post(`/api/posts/${id}/share`);
  return data;
};

// ─── Comments ───────────────────────────────────────────
export const addComment = async (
  postId: string,
  text: string,
  parentComment?: string,
): Promise<ApiResponse<Comment>> => {
  const body: Record<string, string> = { text };
  if (parentComment) {
    body.parentComment = parentComment;
  }
  const { data } = await api.post(`/api/posts/${postId}/comments`, body);
  return { ...data, data: normalizeComment(data.data) };
};

export const getComments = async (
  postId: string,
  cursor?: string,
  limit = 20,
): Promise<ApiResponse<Comment[]>> => {
  const params: Record<string, string | number> = { limit };
  if (cursor) {
    params.cursor = cursor;
  }
  const { data } = await api.get(`/api/posts/${postId}/comments`, { params });
  return { ...data, data: normalizeComments(data.data) };
};

export const getReplies = async (
  commentId: string,
  cursor?: string,
  limit = 20,
): Promise<ApiResponse<Comment[]>> => {
  const params: Record<string, string | number> = { limit };
  if (cursor) {
    params.cursor = cursor;
  }
  const { data } = await api.get(`/api/comments/${commentId}/replies`, { params });
  return { ...data, data: normalizeComments(data.data) };
};

export const toggleCommentLike = async (
  commentId: string,
): Promise<ApiResponse<{ liked: boolean; likeCount: number }>> => {
  const { data } = await api.post(`/api/comments/${commentId}/like`);
  return data;
};
export const deleteComment = async (
  commentId: string,
): Promise<ApiResponse<{ message: string }>> => {
  const { data } = await api.delete(`/api/comments/${commentId}`);
  return data;
};
