import axios from 'axios';
import { getToken } from '@/features/auth/utils/authStorage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
    const token = await getToken();
    console.log('[fridgeApi] interceptor url:', config.url, 'token:', token ? 'OK' : 'MISSING');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const getFridges = async (groupId) => {
    const response = await apiClient.get(`/groups/${groupId}/fridges`);
    return response.data;
};


export const createFridge = async (groupId, { fridgeName }) => {
    const response = await apiClient.post(`/groups/${groupId}/fridges`, { fridgeName });
    return response.data;
};

export const getGroupByFridgeId = async (fridgeId) => {
    const response = await apiClient.get(`/fridges/${fridgeId}/group`);
    return response.data.groupId;
};

export const updateFridge = async (groupId, fridgeId, { fridgeName }) => {
    const response = await apiClient.put(`/groups/${groupId}/fridges/${fridgeId}`, { fridgeName });
    return response.data;
};

export const deleteFridge = async (groupId, fridgeId) => {
    const response = await apiClient.delete(`/groups/${groupId}/fridges/${fridgeId}`);
    return response.data;
};