import axios from 'axios';
import { getToken } from '@/features/auth/utils/authStorage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const formatDate = (createdAt, updatedAt) => {
    const target = updatedAt ?? createdAt;
    if (!target) return '';
    return target.slice(0, 16).replace('T', ' ');
};

const toPostFormat = (post) => ({
    id: post.id,
    createdBy: post.createdBy,
    title: post.title,
    content: post.content,
    author: post.authorNickname,
    postType: post.postType,
    createdAt: formatDate(post.createdAt, post.updatedAt),
    isEdited: !!post.updatedAt,
    likeCount: post.likeCount,
    isLiked: post.isLiked,
    commentCount: post.commentCount,
});



// GET /groups/{groupId}/posts?type=NOTICE&sort=latest
export const getPosts = async (groupId, type = 'NOTICE', sort = 'latest') => {
    const response = await apiClient.get(`/groups/${groupId}/posts`, {
        params: { type, sort }
    });
    return response.data.map(toPostFormat);
};

// GET /posts/{postId}
export const getPost = async (postId) => {
    const response = await apiClient.get(`/posts/${postId}`);
    const data = response.data;
    return {
        ...data,
        createdAt: formatDate(data.createdAt, data.updatedAt),
        isEdited: !!data.updatedAt,
        // 댓글도 변환
        comments: (data.comments ?? []).map(c => ({
            id: c.id,
            createdBy: c.createdBy,
            authorNickname: c.authorNickname,
            content: c.content,
            createdAt: formatDate(c.createdAt, c.updatedAt),
            isEdited: !!c.updatedAt,
            likeCount: c.likeCount,
            isLiked: c.isLiked,
        })).reverse(),
    };
};

// POST /groups/{groupId}/posts
export const createPost = async (groupId, { title, content, postType = 'NOTICE' }) => {
    const response = await apiClient.post(`/groups/${groupId}/posts`, { title, content, postType });
    return toPostFormat(response.data);
};

// PUT /posts/{postId}
export const updatePost = async (postId, { title, content }) => {
    const response = await apiClient.put(`/posts/${postId}`, { title, content });
    return toPostFormat(response.data);
};

// DELETE /posts/{postId}
export const deletePost = async (postId) => {
    await apiClient.delete(`/posts/${postId}`);
};