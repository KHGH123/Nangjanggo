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
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

export const createFood = async (groupId, userId, { fridgeId, name, quantity, memo }) => {
    const response = await apiClient.post(`/groups/${groupId}/users/${userId}/foods`, {
        fridgeId,
        name,
        quantity,
        memo,
    });
    return response.data;
};

export const getFoodsByFridge = async (groupId, fridgeId, params = {}) => {
    const response = await apiClient.get(`/groups/${groupId}/fridges/${fridgeId}/foods`, { params });
    return response.data;
};

export const getMyFoodsByFridge = async (groupId, fridgeId, params = {}) => {
    const response = await apiClient.get(`/groups/${groupId}/fridges/${fridgeId}/foods/me`, { params });
    return response.data;
};

export const deleteFood = async (foodId) => {
    const response = await apiClient.delete(`/foods/${foodId}`);
    return response.data;
};

export const printLabel = async (fridgeId) => {
    const response = await apiClient.post(`/fridges/${fridgeId}/label`);
    return response.data; // { foodId, startDate, endDate }
};

export const updateFood = async (foodId, { name, quantity, memo }) => {
    const response = await apiClient.patch(`/foods/${foodId}`, { name, quantity, memo });
    return response.data;
};
