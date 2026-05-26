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

export const createFood = async (groupId, fridgeId, { name, quantity, memo }) => {
    const response = await apiClient.post(`/groups/${groupId}/fridges/${fridgeId}/foods`, {
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

export const getFoodById = async (foodId) => {
    const response = await apiClient.get(`/foods/${foodId}`);
    return response.data; // { foodId, name, ownerName, startDate, endDate, status }
};

export const printLabel = async (fridgeId, foodId) => {
    const response = await apiClient.post(`/hardware/fridges/${fridgeId}/label`, null, { params: { foodId } });
    return response.data;
};

export const createAndPrintLabel = async (fridgeId, groupId) => {
    const response = await apiClient.post(`/hardware/fridges/${fridgeId}/label/new`, null, { params: { groupId } });
    return response.data; // { foodId }
};

export const updateFood = async (foodId, { name, quantity, memo }) => {
    const response = await apiClient.put(`/foods/${foodId}`, { name, quantity, memo });
    return response.data;
};

// [POST /groups/:groupId/foods/:foodId/claim]
// 찜하기 (내 음식이면 기간 연장, 타인 음식이면 찜) - 둘 다 -3pt
export const claimFood = async (groupId, foodId) => {
    const response = await apiClient.post(`/groups/${groupId}/foods/${foodId}/claim`);
    return response.data;
};

// [DELETE /groups/:groupId/foods/:foodId/claim]
// 찜 취소 - +3pt 환불
export const unclaimFood = async (groupId, foodId) => {
    const response = await apiClient.delete(`/groups/${groupId}/foods/${foodId}/claim`);
    return response.data;
}