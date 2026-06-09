import axios from 'axios';
import { getToken } from '@/features/auth/utils/authStorage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const adminClient = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

adminClient.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const getAdminUsers = (params) =>
    adminClient.get('/api/admin/users', { params }).then(r => r.data);

export const getAdminUserGroups = (userId) =>
    adminClient.get(`/api/admin/users/${userId}/groups`).then(r => r.data);

export const getAdminGroups = (params) =>
    adminClient.get('/api/admin/groups', { params }).then(r => r.data);

export const getAdminFridges = (groupId) =>
    adminClient.get(`/api/admin/groups/${groupId}/fridges`).then(r => r.data);

export const getAdminFoods = (fridgeId) =>
    adminClient.get(`/api/admin/fridges/${fridgeId}/foods`).then(r => r.data);

export const getAdminFoodDetail = (foodId) =>
    adminClient.get(`/api/admin/foods/${foodId}`).then(r => r.data);

export const updateUserRole = (userId, role) =>
    adminClient.patch(`/api/admin/users/${userId}/role`, { role }).then(r => r.data);