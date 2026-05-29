import axios from 'axios';
import { getToken } from '@/features/auth/utils/authStorage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// POST /posts/{postId}/like — 게시글 좋아요 토글
export const togglePostLike = async (postId) => {
    const response = await apiClient.post(`/posts/${postId}/like`);
    return response.data; // { liked, likeCount }
};

// DELETE /posts/{postId}/like — 게시글 좋아요 취소
export const deletePostLike = async (postId) => {
    const response = await apiClient.delete(`/posts/${postId}/like`);
    return response.data;
};

// POST /comments/{commentId}/like — 댓글 좋아요 토글
export const toggleCommentLike = async (commentId) => {
    const response = await apiClient.post(`/comments/${commentId}/like`);
    return response.data;
};

// DELETE /comments/{commentId}/like — 댓글 좋아요 취소
export const deleteCommentLike = async (commentId) => {
    const response = await apiClient.delete(`/comments/${commentId}/like`);
    return response.data;
};