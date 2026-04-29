import axios from 'axios';
import { getToken } from '@/features/auth/utils/authStorage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
});

apiClient.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const getMyGroups = async () => {
    const response = await apiClient.get('/groups/my');
    return response.data;
};

export const joinGroup = async ({ groupName, inviteCode, nickname }) => {
    const response = await apiClient.post('/groups/join', { groupName, inviteCode, nickname });
    return response.data;
};
