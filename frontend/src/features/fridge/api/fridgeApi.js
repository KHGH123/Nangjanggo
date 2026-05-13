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

