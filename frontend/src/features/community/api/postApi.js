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

const toPostFormat = (post) => ({
    id: post.id,
    title: post.title,
    content: post.content,
    author: post.authorNickname,
    createdAt: post.createdAt?.slice(0, 10),
});

export const getPosts = async (groupId) => {
    const response = await apiClient.get(`/groups/${groupId}/posts`);
    return response.data.map(toPostFormat);
};

export const createPost = async (groupId, { title, content }) => {
    const response = await apiClient.post(`/groups/${groupId}/posts`, { title, content });
    return toPostFormat(response.data);
};

export const updatePost = async (groupId, postId, { title, content }) => {
    const response = await apiClient.put(`/groups/${groupId}/posts/${postId}`, { title, content });
    return toPostFormat(response.data);
};

export const deletePost = async (groupId, postId) => {
    await apiClient.delete(`/groups/${groupId}/posts/${postId}`);
};