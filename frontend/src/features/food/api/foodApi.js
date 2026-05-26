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

export const updateFood = async (foodId, { name, quantity, memo, tag }) => {
    const response = await apiClient.put(`/foods/${foodId}`, { name, quantity, memo, tag });
    return response.data;
};

export const analyzeFood = async (foodId, name = null) => {
    const response = await apiClient.post(`/foods/${foodId}/analyze`, name ? { name } : null);
    return response.data; // { name, consumptionDays, nutrition }
};

export const uploadFoodImage = async (foodId, imageUri) => {
    const token = await getToken();
    const formData = new FormData();
    const filename = imageUri.split('/').pop();
    const ext = filename.split('.').pop().toLowerCase();
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
    formData.append('image', { uri: imageUri, name: filename, type: mimeType });

    const response = await fetch(`${BASE_URL}/foods/${foodId}/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    });
    if (!response.ok) throw new Error('이미지 업로드 실패');
    return response.json(); // { imageUrl }
};
