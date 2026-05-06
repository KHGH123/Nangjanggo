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

export const getFridgesByGroup = async (groupId) => {
    const response = await apiClient.get(`/groups/${groupId}/fridges`);
    return response.data;
};

export const createFood = async (fridgeId, data) => {
    const response = await apiClient.post(`/fridges/${fridgeId}/foods`, data);
    return response.data;
};
