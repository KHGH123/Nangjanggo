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

const formatDate = (createdAt, updatedAt) => {
    const target = updatedAt ?? createdAt;
    if (!target) return '';
    return target.slice(0, 16).replace('T', ' ');
    // "2026-05-23T14:30:00" → "2026-05-23 14:30" 날짜 형식
};

const toCommentFormat = (comment) => ({
    id: comment.id,
    createdBy: comment.createdBy,
    authorNickname: comment.authorNickname,  // author → authorNickname으로 통일
    content: comment.content,
    createdAt: formatDate(comment.createdAt, comment.updatedAt),
    isEdited: !!comment.updatedAt,
    likeCount: comment.likeCount,
    isLiked: comment.isLiked,
});

// GET /posts/{postId}/comments
export const getComments = async (postId) => {
    const response = await apiClient.get(`/posts/${postId}/comments`);
    return response.data.map(toCommentFormat);
};

// POST /posts/{postId}/comments
export const createComment = async (postId, { content }) => {
    const response = await apiClient.post(`/posts/${postId}/comments`, { content });
    return toCommentFormat(response.data);
};

// PUT /comments/{commentId}
export const updateComment = async (commentId, { content }) => {
    const response = await apiClient.put(`/comments/${commentId}`, { content });
    return toCommentFormat(response.data);
};

// DELETE /comments/{commentId}
export const deleteComment = async (commentId) => {
    await apiClient.delete(`/comments/${commentId}`);
};